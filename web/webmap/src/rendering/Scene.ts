import { Datum } from "../geography/Datum";
import { Projection } from "../geography/Projection";
import { DoubleMatrix } from "../geometry/DoubleMatrix";
import { DoubleVector3 } from "../geometry/DoubleVector3";
import { Ray3 } from "../geometry/Ray3";
import { TileDescriptor } from "../models/TileDescriptor";
import { Camera } from "../scene/Camera";
import { ElevationLayer } from "../scene/layers/dem/ElevationLayer";
import { ElevationTile } from "../scene/layers/dem/ElevationTile";
import { LayerStats, MatchType, ResourceRequestType } from "../scene/layers/Layer";
import { TextureLayer } from "../scene/layers/texture/TextureLayer";
import { Lod, LodDetails } from "../scene/Lod";
import { GenericCache } from "../utils/GenericCache";
import { TileModel } from "./renderables/TileModel";
import { RenderContext } from "./RenderContext";
import { setBuffers, setMatrices } from "./Utils";

const tesselationSteps = 42;

export type RenderStats = {
    models: {
        cached: number;
        rendered: number;
    },
    texture?: LayerStats;
    elevation?: LayerStats;
}

export class Scene {
    public lod: Lod;

    public modelCache: GenericCache<string, TileModel>;

    /**
     * The tiles that are currently visible. This list is e.g. used when the intersection
     * of a ray with the scene is requested.
     */
    private visibleTiles: TileDescriptor[] = [];

    constructor(
        private context: RenderContext,
        private datum: Datum,
        private projection: Projection,
        private textureLayer: TextureLayer | undefined,
        private elevationLayer: ElevationLayer | undefined,
        private minLevel = 2,
        private maxLevel = 17,
        maxModelCount = 1024,
    ) {
        this.lod = new Lod(datum, projection, this.elevationLayer);

        this.modelCache = new GenericCache<string, TileModel>(maxModelCount, (_, v) => {
            v.dispose();
            this.textureLayer?.decreaseRefCount(v.texture.descriptor);
            if (v.elevation)
                this.elevationLayer?.decreaseRefCount(v.elevation.descriptor);
        });
    }

    public dispose() {
        this.modelCache.clear();
        this.textureLayer?.dispose();
    }

    public render(camera: Camera): RenderStats | undefined {
        const wishlist = this.lod.performLevelOfDetail(this.context, camera, this.minLevel, this.maxLevel, this.modelCache);
        const wishlistDescriptors = wishlist.map(w => w.desc);

        this.fetchTextures(camera, wishlist);
        this.fetchElevations(camera, wishlist);

        // this.refreshModels(wishlistDescriptors);
        // const models = this.getBestModels(wishlistDescriptors);

        const models = this.getModels(wishlistDescriptors);


        this.visibleTiles = models.map(m => m.descriptor);

        const gl = this.context.gl;
        if (!camera || !gl || !this.context.tileProgram)
            return;

        // Configure fog
        gl.uniform4fv(gl.getUniformLocation(this.context.tileProgram, "uFogColor"), [0.39, 0.58, 0.94, 1]); // cornflower blue
        gl.uniform1f(gl.getUniformLocation(this.context.tileProgram, "uFogNear"), 1000);
        gl.uniform1f(gl.getUniformLocation(this.context.tileProgram, "uFogFar"), 100000000);

        for (const model of models)
            this.renderObject(this.context.tileProgram!, camera, model.boundingSphere.center, {
                vertexBuffer: model.vertexBuffer!,
                textureBuffer: model.textureBuffer!,
                indexBuffer: model.indexBuffer,
            }, {
                color: model.color,
            }, model.texture.data, model.triCount);

        const textureLayerStats = this.textureLayer?.getStats();
        const elevationLayerStats = this.elevationLayer?.getStats();

        return {
            models: {
                cached: this.modelCache.getSize(),
                rendered: models.length,
            },
            texture: textureLayerStats,
            elevation: elevationLayerStats,
        };
    }

    private getModels(wishlist: TileDescriptor[]): TileModel[] {
        const result: TileModel[] = [];

        for (const desc of wishlist) {
            const bestTexture = this.textureLayer?.getBestAvailableMatch(desc);
            const bestElevation = this.elevationLayer?.getBestAvailableMatch(desc);

            const model = this.modelCache.peek(desc.toString());
            if (model) {
                // Check if better resources arrived in the meantime and update the
                // buffers if so.
                this.refreshBuffers(model, bestTexture, bestElevation, desc);
                result.push(model);
                continue;
            }

            // Check if we have the best resources available for the tile we want to render.
            if (bestTexture && bestTexture.descriptor.equals(desc) &&
                (!this.elevationLayer || this.elevationLayer.getAppropriateDescriptor(desc)?.equals(bestElevation?.descriptor))) {
                // We have the best resources available. Let's create the model.
                const tile = new TileModel(
                    this.context,
                    desc,
                    bestTexture,
                    bestElevation,
                    tesselationSteps,
                    this.datum,
                    this.projection,
                    1);

                result.push(tile);
                this.updateCache(tile);
                continue;
            }


            // Sometimes when zooming out, 4 tiles are replaced by one that contains all 4.
            // In this case it's ok to use these until the new model is ready.
            const childDescriptors = [
                new TileDescriptor(desc.x * 2, desc.y * 2, desc.zoom + 1),
                new TileDescriptor(desc.x * 2 + 1, desc.y * 2, desc.zoom + 1),
                new TileDescriptor(desc.x * 2, desc.y * 2 + 1, desc.zoom + 1),
                new TileDescriptor(desc.x * 2 + 1, desc.y * 2 + 1, desc.zoom + 1)
            ];

            const children = childDescriptors.map(d => this.modelCache.peek(d.toString()));

            if (children.filter(c => c === undefined).length <= 1) {
                // We have at least 3 of the 4 children. Let's use those for now and
                // create the tiles that are missing.
                this.completeQuad(childDescriptors, result);

                // However, we do want the parent tile to load!
                continue;
            }

            // We have nothing to render for that descriptor yet.
            // Let's create a new model.
            if (!bestTexture)
                continue;

            const tile = new TileModel(
                this.context,
                desc,
                bestTexture,
                bestElevation,
                tesselationSteps,
                this.datum,
                this.projection,
                1);

            this.updateCache(tile);

            result.push(tile);
            continue;
        }

        // Touch all models used in the result to prevent them from being removed.
        result.forEach(m => this.modelCache.touch(m.descriptor.toString()));

        this.modelCache.age();

        return result;
    }

    private updateCache(tile: TileModel) {
        const existing = this.modelCache.peek(tile.descriptor.toString());
        this.modelCache.set(tile.descriptor.toString(), tile);
        this.textureLayer?.increaseRefCount(tile.texture.descriptor);
        if (tile.elevation)
            this.elevationLayer?.increaseRefCount(tile.elevation.descriptor);

        if (existing) {
            this.textureLayer?.decreaseRefCount(existing.texture.descriptor);
            if (existing.elevation)
                this.elevationLayer?.decreaseRefCount(existing.elevation.descriptor);
        }
    }

    /**
     * Completes a quad of tiles by generating the missing ones.
     */
    private completeQuad(childDescriptors: TileDescriptor[], result: TileModel[]) {
        for (const childDescriptor of childDescriptors) {
            const child = this.modelCache.peek(childDescriptor.toString());
            if (child)
                result.push(child);
            else {
                const bestChildTexture = this.textureLayer?.getBestAvailableMatch(childDescriptor);

                console.assert(bestChildTexture !== undefined, "No texture for child tile");
                if (!bestChildTexture)
                    continue;

                this.textureLayer?.increaseRefCount(bestChildTexture.descriptor);

                const tile = new TileModel(
                    this.context,
                    childDescriptor,
                    bestChildTexture,
                    this.elevationLayer?.getBestAvailableMatch(childDescriptor),
                    tesselationSteps,
                    this.datum,
                    this.projection,
                    1);

                this.updateCache(tile);

                result.push(tile);
            }
        }
    }

    /**
     * Checks if the model's resources are still the best available ones and updates
     * the buffers if necessary.
     */
    private refreshBuffers(model: TileModel, bestTexture: MatchType<WebGLTexture> | undefined, bestElevation: MatchType<ElevationTile> | undefined, desc: TileDescriptor) {
        const updateTextureBuffer = model.texture.descriptor !== bestTexture?.descriptor;
        const updateVertexBuffer = model.elevation?.descriptor !== bestElevation?.descriptor;

        // If better resources arrived in the meantime we can update the model!
        if (updateTextureBuffer && bestTexture) {
            this.textureLayer?.increaseRefCount(bestTexture.descriptor);
            this.textureLayer?.decreaseRefCount(model.texture.descriptor);
            model.updateTextureBuffer(bestTexture);
        }

        if (updateVertexBuffer && bestElevation) {
            console.log("update vertex buffer", desc.toString());
            this.elevationLayer?.increaseRefCount(bestElevation.descriptor);

            if (model.elevation?.descriptor)
                this.elevationLayer?.decreaseRefCount(model.elevation?.descriptor);

            model.updateVertexBuffer(bestElevation);
        }
    }

    private fetchElevations(camera: Camera, wishlist: LodDetails[]) {
        const elevationsToFetch: ResourceRequestType[] = [];

        const added = new Set<string>();
        for (const element of wishlist) {
            if (this.elevationLayer?.getCached(element.desc))
                // This elevation is already loaded
                continue;

            // Find the next elevation to load. It is that tile that is closest to the
            // one that's already loaded.
            let parentDescriptors = element.desc.getAllParents(true).reverse().map(d => this.elevationLayer?.getAppropriateDescriptor(d)).filter(d => d !== undefined) as TileDescriptor[];

            const uniq: { [key: number]: TileDescriptor } = {};
            parentDescriptors.forEach(d => uniq[d.zoom] = d);
            parentDescriptors = Object.values(uniq).sort((a, b) => a.zoom - b.zoom);

            if (!parentDescriptors.length)
                continue;

            const elevationRequests = parentDescriptors.filter(d => this.elevationLayer?.getCached(d) === undefined);

            for (const elevationRequest of elevationRequests) {
                if (!elevationRequest || added.has(elevationRequest.toString()))
                    continue;

                added.add(elevationRequest.toString());

                const priority = -elevationRequest.zoom;

                elevationsToFetch.push({
                    priority,
                    desc: elevationRequest!,
                });
            }
        }

        this.elevationLayer?.request(elevationsToFetch);
    }

    private fetchTextures(camera: Camera, wishlist: LodDetails[]) {
        const texturesToFetch: ResourceRequestType[] = [];
        const camPosition = camera.getCameraPosition();

        const added = new Set<string>();
        for (const element of wishlist) {
            if (this.textureLayer?.getCached(element.desc))
                // This texture is already loaded
                continue;

            // Find the next texture to load. It is that tile that is closest to the
            // one that's already loaded.
            const parentDescriptors = element.desc.getAllParents(true).reverse().filter(d => d.zoom >= Math.max(this.minLevel, element.desc.zoom - 2));
            const textureDesc = parentDescriptors.find(d => this.textureLayer?.getCached(d) === undefined);

            if (!textureDesc || added.has(textureDesc.toString()))
                continue;

            added.add(textureDesc.toString());

            const distanceToCamera = -element.boundingSphere.center.distanceTo(camPosition);
            const priority = textureDesc.zoom * -10000 + Math.min(19999, distanceToCamera);

            texturesToFetch.push({
                priority,
                desc: textureDesc!,
            });
        }

        this.textureLayer?.request(texturesToFetch);
    }

    public renderObject(program: WebGLProgram, camera: Camera, modelPosition: DoubleVector3, buffers: {
        vertexBuffer: WebGLBuffer,
        textureBuffer?: WebGLBuffer,
        colorBuffer?: WebGLBuffer,
        indexBuffer?: WebGLBuffer,
    }, uniforms: {
        color?: [number, number, number],
    },
        texture: WebGLTexture | undefined,
        triCount: number) {
        const gl = this.context.gl;
        if (!gl)
            throw new Error("No GL context");

        gl.useProgram(program);

        // The model's origin is the bounding sphere's center, and we need to
        // calculate the relative position of that to the camera. The usual way
        // to do this is to multiply the model- and view matrix, but that would
        // involve very large numbers (the translation part of the model matrix)
        // which would be multiplied with very small numbers (the rotation part),
        // leading to a dramatic and visible loss of precision.

        // To remedy this, we're calculating a "model-to-camera" translation matrix,
        // which only contains relative translation information and thus much
        // smaller numbers. This translation matrix is then multiplied by the 
        // rotation part of the view matrix.
        const cameraPosition = camera.getCameraPosition();

        const modelToCameraTranslation = DoubleMatrix.getTranslationMatrix(
            modelPosition!.x - cameraPosition!.x,
            modelPosition!.y - cameraPosition!.y,
            modelPosition!.z - cameraPosition!.z
        );

        setMatrices(this.context, program, {
            projectionMatrix: camera?.getProjectionMatrix(),
            modelMatrix: modelToCameraTranslation,
            viewMatrix: camera?.getViewMatrix().resetTranslation(),
        });

        setBuffers(this.context, program, {
            vertexBuffer: buffers.vertexBuffer,
            indexBuffer: buffers?.indexBuffer,
            colorBuffer: buffers?.colorBuffer,
            textureCoordBuffer: buffers?.textureBuffer,
            texture,
            color: uniforms.color,
        });

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        if (texture) {
            // Tell WebGL we want to affect texture unit 0
            gl.activeTexture(gl.TEXTURE0);

            // Bind the texture to texture unit 0
            gl.bindTexture(gl.TEXTURE_2D, texture);

            // Tell the shader we bound the texture to texture unit 0
            gl.uniform1i(this.context.locations.sampler, 0);
        }

        if (buffers.indexBuffer)
            gl.drawElements(gl.TRIANGLES, triCount * 3, gl.UNSIGNED_SHORT, 0);
        else
            gl.drawArrays(gl.TRIANGLES, 0, triCount * 3);
    }

    /**
     * Intersects the scene with a ray and returns the closest intersection.
     */
    public getIntersection(ray: Ray3) {
        // List of candidate models that the ray could intersect with.
        const candidates: { distance: number, model: TileModel }[] = [];

        for (const desc of this.visibleTiles) {
            const model = this.modelCache.peek(desc.toString());
            if (!model)
                continue;

            const intersections = ray.intersectSphere(model.boundingSphere.center, model.boundingSphere.radius);

            if (intersections.length === 0)
                // Ray doesn't intersect the bounding sphere, so it doesn't intersect the model.
                // We can safely skip this one.
                continue;

            const distance = Math.min(...intersections.map(i => ray.origin.distanceTo(i)));

            candidates.push({ distance, model });
        }

        candidates.sort((a, b) => a.distance - b.distance);

        let closestIntersection: {
            distance: number,
            model: TileModel,
            intersection: DoubleVector3,
        } | undefined = undefined;

        for (const intersection of candidates) {
            if (closestIntersection && intersection.distance > closestIntersection.distance)
                // The minimum distance to the bounding sphere is larger than the
                // minimum distance to the closest intersection so far. 
                // Any intersection with the model that this bounding sphere represents
                // would be further away than the closest intersection we've found so far.
                // As we've sorted the intersections by distance, we can safely stop here.
                break;

            // Calculate model intersection and check if it's closer.
            const model = intersection.model!;
            const modelIntersection = model.intersectRay(ray);

            if (!modelIntersection)
                continue;

            if (!closestIntersection || modelIntersection.distance < closestIntersection.distance)
                closestIntersection = {
                    model,
                    distance: modelIntersection.distance,
                    intersection: modelIntersection.point,
                };
        }

        return closestIntersection;
    }
}