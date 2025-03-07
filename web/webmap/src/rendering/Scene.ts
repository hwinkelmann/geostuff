import { Datum } from "../geography/Datum";
import { Projection } from "../geography/Projection";
import { DoubleMatrix } from "../geometry/DoubleMatrix";
import { TileDescriptor } from "../models/TileDescriptor";
import { Camera } from "../scene/Camera";
import { ElevationLayer } from "../scene/layers/dem/ElevationLayer";
import { ResourceRequestType } from "../scene/layers/Layer";
import { TextureLayer } from "../scene/layers/texture/TextureLayer";
import { Lod, LodDetails } from "../scene/Lod";
import { GenericCache } from "../utils/GenericCache";
import { TileModel } from "./renderables/TileModel";
import { RenderContext } from "./RenderContext";
import { setBuffers, setMatrices } from "./Utils";

export class Scene {
    private lod: Lod;

    private modelCache: GenericCache<string, TileModel>;

    constructor(
        private context: RenderContext,
        private datum: Datum,
        private projection: Projection,
        private textureLayer: TextureLayer | undefined,
        private elevationLayer: ElevationLayer | undefined,
        private minLevel = 1,
        private maxLevel = 17,
        maxModelCount = 64,
    ) {
        this.lod = new Lod(datum, projection);

        this.modelCache = new GenericCache<string, TileModel>(maxModelCount, (_, v) => {
            v.dispose();
        });
    }

    public dispose() {
        this.modelCache.clear();
        this.textureLayer?.dispose();
    }

    public render(camera: Camera) {
        const wishlist = this.lod.performLevelOfDetail(camera, this.minLevel, this.maxLevel);
        const wishlistDescriptors = wishlist.map(w => w.desc);

        this.refreshModels(wishlistDescriptors);
        this.fetchTextures(camera, wishlist);

        const models = this.getBestModels(wishlistDescriptors);

        for (const model of models)
            this.renderTile(model, camera);
    }

    private renderTile(model: TileModel, camera: Camera) {
        if (!model || !camera || !this.context.gl || !this.context.tileProgram)
            return;

        const gl = this.context.gl;

        gl.useProgram(this.context.tileProgram);

        // The model's origin is the bounding sphere's center, and we need to
        // calculate the relative position of that to the camera. The usual way
        // to do this is to multiply the model- and view matrix, but that would
        // involve very large numbers (the translation part of the model matrix)
        // which would be multiplied with very small numbers (the rotation part),
        // leading to a loss of precision.
        // To remedy this, we're calculating a "model-to-camera" translation matrix,
        // which is then multiplied by the rotation part of the view matrix.
        const cameraPosition = camera.getCameraPosition();
        const modelPosition = model.boundingSphere.center;

        const modelToCameraTranslation = DoubleMatrix.getTranslationMatrix(
            modelPosition!.x - cameraPosition!.x,
            modelPosition!.y - cameraPosition!.y,
            modelPosition!.z - cameraPosition!.z
        );

        setMatrices(this.context, this.context.tileProgram, {
            projectionMatrix: camera?.getProjectionMatrix(),
            modelMatrix: modelToCameraTranslation,
            viewMatrix: camera?.getViewMatrix().resetTranslation(),
        });

        setBuffers(this.context, this.context.tileProgram, {
            vertexBuffer: model.vertexBuffer!,
            textureCoordBuffer: model.textureBuffer!,
            indexBuffer: model.indexBuffer,
            color: [1, 0, 0],
        });

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        if (model.texture) {
            // Tell WebGL we want to affect texture unit 0
            gl.activeTexture(gl.TEXTURE0);

            // Bind the texture to texture unit 0
            gl.bindTexture(gl.TEXTURE_2D, model.texture);

            // Tell the shader we bound the texture to texture unit 0
            gl.uniform1i(this.context.locations.sampler, 0);
        }

        gl.drawElements(gl.TRIANGLES, model.triCount * 3, gl.UNSIGNED_SHORT, 0);
    }

    /**
     * Returns a list of the models that match the requested tiles best.
     * This operation is non-blocking and will return immediately. Missing
     * models will be loaded asynchronously.
     */
    private getBestModels(wishlist: TileDescriptor[]): TileModel[] {
        const bestMatches: TileModel[] = [];

        // Check how we can best satisfy the necessary tiles
        for (const tile of wishlist) {
            let parent: TileDescriptor | undefined = tile;

            do {

                const existing = this.modelCache.peek(parent.toString());
                if (existing) {
                    bestMatches.push(existing);
                    break;
                }
                parent = parent.getParent();
            } while (parent);
        }

        // Remove all tiles that overlap with others
        const topDownSorted = bestMatches.sort((a, b) => a.textureDescriptor.zoom - b.textureDescriptor.zoom);
        const result = topDownSorted.filter(m => !topDownSorted.some(other => m.mapDescriptor.getAllParents().includes(other.mapDescriptor)));

        // Touch all models used in the result to prevent them from being removed.
        // Also touch their parents because we might need them later.
        const allInvolvedTiles = new Set<TileDescriptor>(result.map(m => [m.mapDescriptor, m.mapDescriptor.getAllParents()]).flat() as TileDescriptor[]);
        allInvolvedTiles.forEach(m => this.modelCache.touch(m.toString()));

        return result;
    }

    private fetchTextures(camera: Camera, wishlist: LodDetails[]) {
        const texturesToFetch: ResourceRequestType[] = [];
        const camPosition = camera.getCameraPosition();

        for (const element of wishlist) {
            if (this.textureLayer?.getCached(element.desc))
                // This texture is already loaded
                continue;

            // Find the next texture to load. It is that tile that is closest to the
            // one that's already loaded.
            const parentDescriptors = element.desc.getAllParents(true).reverse().filter(d => d.zoom >= this.minLevel);
            const textureDesc = parentDescriptors.find(d => this.textureLayer?.getCached(d) === undefined);
            
            const distanceToCamera = -element.boundingSphere.center.distanceTo(camPosition);

            const priority = element.desc.zoom * -10000 - Math.min(9999, distanceToCamera);

            texturesToFetch.push({
                priority,
                desc: textureDesc!,
            });
        }

        this.textureLayer?.request(texturesToFetch);
    }


    /**
     * Checks what we have, and requests the next missing items. Triggers remodelling
     * of affected models if necessary.
     * This function is non-blocking and will return immediately.
     * @param wishlist All the tiles our view is currently wishing for
     */
    private refreshModels(wishlist: TileDescriptor[]) {
        for (const desc of wishlist) {
            const parentDescriptors = desc.getAllParents(true);

            const bestExistingTextureDescriptor = parentDescriptors.find(d => this.textureLayer?.getCached(d) !== undefined);
            const bestExistingTexture = bestExistingTextureDescriptor ? this.textureLayer?.getCached(bestExistingTextureDescriptor) : undefined;

            const existingModel = this.modelCache.peek(desc.toString());
            const doesBetterTextureExist = !existingModel ||
                (bestExistingTextureDescriptor && existingModel.textureDescriptor.zoom < bestExistingTextureDescriptor.zoom);

            // TODO: Add elevation layer check
            if (doesBetterTextureExist && bestExistingTextureDescriptor && bestExistingTexture) {
                // We need to build a new model
                const tile = new TileModel(this.context, bestExistingTextureDescriptor, desc, bestExistingTexture, 42, this.datum, this.projection);

                // If this model is a refresh of something that already exists, we need to dispose the
                // old model properly.
                if (this.modelCache.get(desc.toString())) {
                    this.modelCache.get(desc.toString())!.dispose();
                    this.textureLayer?.decreaseRefCount(this.modelCache.get(desc.toString())!.textureDescriptor);
                }

                this.modelCache.set(desc.toString(), tile);
            }
        }
    }
}