import { BoundingBox } from "../../geography/BoundingBox";
import { Coordinate } from "../../geography/Coordinate";
import { Datum } from "../../geography/Datum";
import { Projection } from "../../geography/Projection";
import { DoubleVector3 } from "../../geometry/DoubleVector3";
import { Ray3 } from "../../geometry/Ray3";
import { TileDescriptor } from "../../models/TileDescriptor";
import { ElevationTile } from "../../scene/layers/dem/ElevationTile";
import { MatchType } from "../../scene/layers/Layer";
import { IntersectableModel } from "../IntersectableModel";
import { RenderContext } from "../RenderContext";

export class TileModel extends IntersectableModel {
    // WebGL index buffer
    public triCount: number = 0;

    public indexBuffer: WebGLBuffer | undefined = undefined;
    public vertexBuffer: WebGLBuffer | undefined = undefined;
    public textureBuffer: WebGLBuffer | undefined = undefined;

    private bounds: BoundingBox;

    public color: [number, number, number] = [1, 1, 1];

    public boundingSphere: {
        center: DoubleVector3,
        radius: number,
    } = {
            center: new DoubleVector3(0, 0, 0),
            radius: 0,
        };

    constructor(
        protected context: RenderContext, 
        public descriptor: TileDescriptor,
        public texture: MatchType<WebGLTexture>, 
        public elevation: MatchType<ElevationTile> | undefined,
        protected tesselationSteps: number,
        protected datum: Datum,
        protected projection: Projection,
        protected elevationExaggeration: number,
    ) {
        super();

        this.bounds = BoundingBox.fromCoordinates([
            this.projection.fromDescriptorCoordinate(this.descriptor.x, this.descriptor.y, this.descriptor.zoom),
            this.projection.fromDescriptorCoordinate(this.descriptor.x + 1, this.descriptor.y + 1, this.descriptor.zoom),
        ])!;

        this.triCount = (this.tesselationSteps + 1) * (this.tesselationSteps + 1) * 2;

        this.init(context);
    }

    /**
     * Disposes all resources EXCEPT the texture. That might be shared with other instances.
     */
    public dispose() {
        const gl = this.context.gl;

        if (this.indexBuffer)
            gl?.deleteBuffer(this.indexBuffer);

        if (this.vertexBuffer)
            gl?.deleteBuffer(this.vertexBuffer);

        if (this.textureBuffer)
            gl?.deleteBuffer(this.textureBuffer);
    }

    public init(context: RenderContext) {
        this.context = context;
        const gl = this.context.gl;
        if (!gl)
            throw new Error("No GL context");

        // Create index-, vertex- and texture coordinate buffers
        const ib = TileModel.buildIndexBuffer(gl, this.tesselationSteps);
        this.indexBuffer = ib.indexBuffer;
        this.indices = ib.indices;

        this.updateVertexBuffer(this.elevation);
        this.updateTextureBuffer(this.texture);

    }

    public updateTextureBuffer(texture: MatchType<WebGLTexture>) {
        const gl = this.context.gl;
        if (!gl)
            throw new Error("No GL context");

        if (this.textureBuffer)
            gl.deleteBuffer(this.textureBuffer);

        this.texture = texture;

        this.textureBuffer = TileModel.buildTextureBuffer(gl, this.tesselationSteps, this.descriptor, this.texture.descriptor);
    }

    public updateVertexBuffer(elevation: MatchType<ElevationTile> | undefined) {
        const gl = this.context.gl;
        if (!gl)
            throw new Error("No GL context");

        if (this.vertexBuffer)
            gl.deleteBuffer(this.vertexBuffer);

        this.elevation = elevation ?? this.elevation;

        const vb = TileModel.buildVertexBuffer(gl, this.bounds, this.tesselationSteps, this.elevation?.data, this.datum, this.elevationExaggeration);

        this.vertexBuffer = vb.vertexBuffer;
        this.vertices = vb.vertices;
        this.boundingSphere = vb.boundingSphere;
    }

    private static buildTextureBuffer(gl: WebGL2RenderingContext, tesselationSteps: number, mapDescriptor: TileDescriptor, textureDescriptor: TileDescriptor) {
        const textureBounds = TileModel.getTextureBounds(mapDescriptor, textureDescriptor);
        const textureCoordinates: number[] = [];

        for (let y = -1; y <= tesselationSteps; y++) {
            for (let x = -1; x <= tesselationSteps; x++) {
                const xScale = Math.max(0, Math.min(1, x / (tesselationSteps - 1)));
                const yScale = Math.max(0, Math.min(1, y / (tesselationSteps - 1)));

                // In WebGL texture space 0/0 is the bottom left and 1/1 is the top right corner,
                // but in images 0/0 is the top left. So we need to flip the coordinates.
                const xt = textureBounds.minX + xScale * textureBounds.deltaLongitude;
                const yt = textureBounds.maxY - yScale * textureBounds.deltaLatitude;
                textureCoordinates.push(xt);
                textureCoordinates.push(yt);

                console.assert(xt >= 0 && xt <= 1 && yt >= 0 && yt <= 1, "Invalid texture coordinates");
            }
        }

        // Create texture buffer and assign it
        const textureBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);

        return textureBuffer;
    }

    /**
     * Samples elevation data and generates a vertex buffer for the model.
     */
    private static buildVertexBuffer(gl: WebGL2RenderingContext, bounds: BoundingBox, tesselationSteps: number, elevationTile: ElevationTile | undefined, datum: Datum, exaggerateElevation = 1) {
        const vertices: DoubleVector3[] = [];

        for (let y = -1; y <= tesselationSteps; y++) {
            for (let x = -1; x <= tesselationSteps; x++) {
                const xScale = Math.max(0, Math.min(1, x / (tesselationSteps - 1)));
                const yScale = Math.max(0, Math.min(1, y / (tesselationSteps - 1)));

                const isEdge = (x < 0 || y < 0 || x === tesselationSteps || y === tesselationSteps);

                const coordinate = new Coordinate(
                    bounds.maxLatitude - yScale * bounds.deltaLatitude,
                    bounds.minLongitude + xScale * bounds.deltaLongitude
                );

                coordinate.elevation = (elevationTile?.getElevation(coordinate) ?? 0) * exaggerateElevation;
                if (isEdge)
                    // Edge seams are just extruded for 20 meters 
                    // ¯\_(ツ)_/¯
                    coordinate.elevation -= 20;

                vertices.push(datum.toCarthesian(coordinate));
            }
        }

        console.assert(vertices.length === (tesselationSteps + 2) * (tesselationSteps + 2), "Invalid vertex buffer size");

        // Bounding sphere for scene management
        const boundingSphere = TileModel.getBoundingSphere(vertices);

        // Create vertex buffer and assign it
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

        // We're subtracting the centroid from each vertex. This makes
        // vertex positions in the view model feasible for single precision floats.
        vertices.forEach(v => {
            v.x -= boundingSphere.center.x;
            v.y -= boundingSphere.center.y;
            v.z -= boundingSphere.center.z;
        });

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices.map(v => [v.x, v.y, v.z]).flat()), gl.STATIC_DRAW);

        return {
            vertices,
            vertexBuffer,
            boundingSphere
        }
    }

    /**
     * Generates the index buffer. Basically the index buffer should be identical for every tile.
     * However, I'm thinking to make the edge seams a bit better than just adding 20 meters, hoping
     * for the best. And then I'll need index buffers for each tile.
     */
    private static buildIndexBuffer(gl: WebGL2RenderingContext, tesselationSteps = 4) {
        // Initialize index buffer with 16 bit indices
        const indices: number[] = [];
        for (let y = 0; y <= tesselationSteps; y++)
            for (let x = 0; x <= tesselationSteps; x++) {
                indices.push(TileModel.xy(x, y, tesselationSteps));
                indices.push(TileModel.xy(x, y + 1, tesselationSteps));
                indices.push(TileModel.xy(x + 1, y, tesselationSteps));
                indices.push(TileModel.xy(x + 1, y + 1, tesselationSteps));
                indices.push(TileModel.xy(x + 1, y, tesselationSteps));
                indices.push(TileModel.xy(x, y + 1, tesselationSteps));
            }

        // Create index buffer and assign it
        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        console.assert(indices.length === (tesselationSteps + 1) * (tesselationSteps + 1) * 6, "Invalid index buffer size");

        return {
            indices,
            indexBuffer,
        };
    }

    /**
     * Calculates the intersection of a ray with the model
     * @param ray Ray in world space
     * @returns 
     */
    public intersectRay(ray: Ray3) {
        // Convert ray into model space, which is just shifted by the bounding sphere center
        const modelSpaceRay = new Ray3(
            ray.origin.clone().subtract(this.boundingSphere.center),
            ray.direction,
        );

        return this.intersect(modelSpaceRay);
    }

    private static xy(x: number, y: number, tesselationSteps: number) {
        return x + (tesselationSteps + 2) * y;
    }

    /**
     * Calculates the bounding sphere for a given set of vertices
     * @param vertices Vertices to calculate the bounding sphere for
     * @returns Bounding sphere
     */
    private static getBoundingSphere(vertices: DoubleVector3[]) {
        const center = BoundingBox.fromVectors(vertices)?.centerVector!;

        // Get the maximum distance from the center
        const distancesSq = vertices.map(v => center.distanceToSq(v))
        const maxDistance = Math.sqrt(Math.max(...distancesSq));

        return { center, radius: maxDistance };
    }

    private static getTextureBounds(mapDescriptor: TileDescriptor, textureDescriptor: TileDescriptor) {
        const textureBounds = new BoundingBox(0, 0, 0, 1, 1, 1);
        let stepSize = 0.5;

        const desc = textureDescriptor.clone();
        while (desc.zoom < mapDescriptor.zoom) {
            desc.zoom++;
            desc.x *= 2;
            desc.y *= 2;

            const deltaToMap = mapDescriptor.zoom - desc.zoom;
            const x = (mapDescriptor.x >> deltaToMap) - desc.x;
            const y = (mapDescriptor.y >> deltaToMap) - desc.y;

            if (x === 0)
                textureBounds.maxX -= stepSize;
            else {
                textureBounds.minX += stepSize;
                desc.x++;
            }

            if (y === 0)
                textureBounds.minY += stepSize;
            else {
                textureBounds.maxY -= stepSize;
                desc.y++;
            }

            stepSize /= 2;
        }

        return textureBounds;
    }
}