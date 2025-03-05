import { BoundingBox } from "../../geography/BoundingBox";
import { Coordinate } from "../../geography/Coordinate";
import { Datum } from "../../geography/Datum";
import { Projection } from "../../geography/Projection";
import { DoubleVector3 } from "../../geometry/DoubleVector3";
import { TileDescriptor } from "../../models/TileDescriptor";
import { RenderContext } from "../RenderContext";

export class TileModel {
    // WebGL index buffer
    public triCount: number = 0;

    public indexBuffer: WebGLBuffer | null = null;
    public vertexBuffer: WebGLBuffer | null = null;
    public textureBuffer: WebGLBuffer | null = null;

    public boundingSphere: {
        center: DoubleVector3,
        radius: number,
    } = {
            center: new DoubleVector3(0, 0, 0),
            radius: 0,
        };

    constructor(
        protected context: RenderContext, 
        public textureDescriptor: TileDescriptor, 
        public mapDescriptor: TileDescriptor, 
        public texture: WebGLTexture | undefined,
        protected tesselationSteps: number,
        protected datum: Datum,
        protected projection: Projection,
    ) {
        this.init(context);

        console.log("new tile", {
            mapDescriptor, textureDescriptor
        })
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
        const gl = context.gl;
        if (!gl)
            throw new Error("No GL context");

        // Create index-, vertex- and texture coordinate buffers
        this.indexBuffer = TileModel.buildIndexBuffer(gl, this.tesselationSteps);

        const bounds = BoundingBox.fromCoordinates([
            this.projection.fromDescriptorCoordinate(this.mapDescriptor.x, this.mapDescriptor.y, this.mapDescriptor.zoom),
            this.projection.fromDescriptorCoordinate(this.mapDescriptor.x + 1, this.mapDescriptor.y + 1, this.mapDescriptor.zoom),
        ])!;


        const vb = TileModel.buildVertexBuffer(gl, bounds, this.tesselationSteps, this.datum);

        this.vertexBuffer = vb.vertexBuffer;
        this.boundingSphere = vb.boundingSphere;

        this.textureBuffer = TileModel.buildTextureBuffer(gl, this.tesselationSteps, this.mapDescriptor, this.textureDescriptor);

        this.triCount = (this.tesselationSteps + 1) * (this.tesselationSteps + 1) * 2;
    }

    private static buildTextureBuffer(gl: WebGL2RenderingContext, tesselationSteps: number, mapDescriptor: TileDescriptor, textureDescriptor: TileDescriptor) {
        const textureBounds = TileModel.getTextureBounds(mapDescriptor, textureDescriptor);
        const textureCoordinates: number[] = [];

        for (let y = -1; y <= tesselationSteps; y++) {
            for (let x = -1; x <= tesselationSteps; x++) {
                const xScale = Math.max(0, Math.min(1, x / (tesselationSteps - 1)));
                const yScale = Math.max(0, Math.min(1, y / (tesselationSteps - 1)));

                const xt = textureBounds.minX + xScale * textureBounds.deltaLongitude;
                const yt = textureBounds.maxY - yScale * textureBounds.deltaLatitude;
                textureCoordinates.push(xt);
                
                // In WebGL texture space 0/0 is the bottom left and 1/1 is the top right corner,
                // but in images 0/0 is the top left. So we need to flip the coordinates.
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

    private static buildVertexBuffer(gl: WebGL2RenderingContext, bounds: BoundingBox, tesselationSteps: number, datum: Datum) {
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

                // TODO: Add real elevation sampling here
                coordinate.elevation = 0;
                if (isEdge)
                    coordinate.elevation -= 1;

                vertices.push(datum.toCarthesian(coordinate));
            }
        }

        console.assert(vertices.length === (tesselationSteps + 2) * (tesselationSteps + 2), "Invalid vertex buffer size");

        // Bounding sphere for scene management
        const boundingSphere = TileModel.getBoundingSphere(vertices);

        // Create vertex buffer and assign it
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices.map(v => [
            // We're subtracting the centroid from each vertex. This makes
            // vertex positions in the view model feasible for single precision floats.
            v.x - boundingSphere.center.x,
            v.y - boundingSphere.center.y,
            v.z - boundingSphere.center.z
        ]).flat()), gl.STATIC_DRAW);

        return {
            vertexBuffer,
            boundingSphere
        }
    }

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

        return indexBuffer;
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