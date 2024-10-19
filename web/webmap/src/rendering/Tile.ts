import { BoundingBox } from "../geography/BoundingBox";
import { Coordinate } from "../geography/Coordinate";
import { Datum } from "../geography/Datum";
import { DoubleMatrix } from "../geometry/DoubleMatrix";
import { DoubleVector2 } from "../geometry/DoubleVector2";
import { DoubleVector3 } from "../geometry/DoubleVector3";
import { TileDescriptor } from "../models/TileDescriptor";
import { RenderContext } from "./RenderContext";

const tesselationSteps = 16;

export class Tile {
    public origin: DoubleVector3;
    public bounds: BoundingBox;

    // WebGL index buffer
    public indexBuffer: WebGLBuffer | null;
    public vertexBuffer: WebGLBuffer | null;
    public textureBuffer: WebGLBuffer | null;

    public texture: WebGLTexture | null = null;

    public boundingSphere: {
        center: DoubleVector3,
        radius: number,
    };

    /**
     * 
     * @param context 
     * @param mapDescriptor Descriptor of the map tile
     * @param textureDescriptor Descriptor of the texture to use. The descriptor must match the mapDescriptor or be at a lower zoom level.
     */
    constructor(protected context: RenderContext, public mapDescriptor: TileDescriptor, public textureDescriptor: TileDescriptor) {
        this.bounds = mapDescriptor.getBounds();
        this.origin = Datum.WGS84.toCarthesian(this.bounds.center);

        const gl = this.context.gl;

        // Create vertex buffer
        this.indexBuffer = Tile.buildIndexBuffer(gl);

        const vb = Tile.buildVertexBuffer(gl, this.bounds);
        this.vertexBuffer = vb.vertexBuffer;
        this.boundingSphere = vb.boundingSphere;

        this.textureBuffer = Tile.buildTextureBuffer(gl, mapDescriptor, textureDescriptor);



    }

    public dispose() {
        const gl = this.context.gl;
        if (this.indexBuffer) {
            gl.deleteBuffer(this.indexBuffer);
            this.indexBuffer = null;
        }

        if (this.vertexBuffer) {
            gl.deleteBuffer(this.vertexBuffer);
            this.vertexBuffer = null;
        }

        if (this.textureBuffer) {
            gl.deleteBuffer(this.textureBuffer);
            this.textureBuffer = null;
        }
    }

    public toString(): string {
        return `Tile ${this.mapDescriptor.x},${this.mapDescriptor.y},${this.mapDescriptor.zoom}:\n   Origin: ${this.origin.x}, ${this.origin.y}, ${this.origin.z}\n   Bounds: ${this.bounds.minCoordinate.toString()} - ${this.bounds.maxCoordinate.toString()}`;
    }

    /**
     * Renders the tile
     * @param cameraPosition Carthesian camera position in world space
     */
    public render(context: RenderContext, cameraPosition: DoubleVector3) {
        // Tile center is the origin. We need to translate the tile into camera space without
        // going through world space. The big numbers involved in world space would blow up
        // single precision floating point precision.
        const delta = this.boundingSphere.center.subtract(cameraPosition);
        const objectToCamera = DoubleMatrix.getTranslationMatrix(delta.x, delta.y, delta.z);

        // TODO: Actually render that tile
    }

    private static buildTextureBuffer(gl: WebGL2RenderingContext, mapDescriptor: TileDescriptor, textureDescriptor: TileDescriptor) {
        const textureBounds = Tile.getTextureBounds(mapDescriptor, textureDescriptor);
        const textureCoordinates: DoubleVector2[] = [];

        for (let y = -1; y <= tesselationSteps; y++) {
            for (let x = -1; x <= tesselationSteps; x++) {
                const xScale = Math.max(0, Math.min(1, x / (tesselationSteps - 1)));
                const yScale = Math.max(0, Math.min(1, y / (tesselationSteps - 1)));

                const xt = textureBounds.minX + xScale * textureBounds.deltaLongitude;
                const yt = textureBounds.minY + yScale * textureBounds.deltaLatitude;
                textureCoordinates.push(new DoubleVector2(xt, yt));

                console.assert(xt >= 0 && xt <= 1 && yt >= 0 && yt <= 1, "Invalid texture coordinates");
            }
        }

        // Create texture buffer and assign it
        const textureBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates.map(tc => [tc.x, tc.y]).flat()), gl.STATIC_DRAW);

        return textureBuffer;
    }

    private static buildVertexBuffer(gl: WebGL2RenderingContext, bounds: BoundingBox) {
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

                if (!isEdge)
                    // TODO: Add real elevation sampling here
                    coordinate.elevation = Math.sin(coordinate.latitude) * 100 + Math.cos(coordinate.longitude) * 100;

                const ecef = Datum.WGS84.toCarthesian(coordinate);
                vertices.push(ecef);
            }
        }

        console.assert(vertices.length === (tesselationSteps + 2) * (tesselationSteps + 2), "Invalid vertex buffer size");

        // Bounding sphere for scene management
        const boundingSphere = Tile.getBoundingSphere(vertices);


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

    /**
     * Calculates the bounding sphere for a given set of vertices
     * @param vertices Vertices to calculate the bounding sphere for
     * @returns Bounding sphere
     */
    private static getBoundingSphere(vertices: DoubleVector3[]) {
        const center = Tile.center(vertices);

        // Get the maximum distance from the center
        const maxDistance = Math.sqrt(Math.max(...vertices.map(v => center.distanceToSq(v))));

        return { center, radius: maxDistance };
    }

    private static center(vertices: DoubleVector3[]) {
        const center = new DoubleVector3(0, 0, 0);
        for (const vertex of vertices)
            center.add(vertex);

        center.multiply(1 / vertices.length);
        return center;
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
                textureBounds.maxY -= stepSize;
            else {
                textureBounds.minY += stepSize;
                desc.y++;
            }

            stepSize /= 2;
        }

        return textureBounds;
    }

    private static buildIndexBuffer(gl: WebGL2RenderingContext) {
        // Initialize index buffer with 16 bit indices
        const indices: number[] = [];
        for (let y = 0; y <= tesselationSteps; y++)
            for (let x = 0; x <= tesselationSteps; x++) {
                indices.push(Tile.xy(x, y));
                indices.push(Tile.xy(x, y + 1));
                indices.push(Tile.xy(x + 1, y));

                indices.push(Tile.xy(x + 1, y + 1));
                indices.push(Tile.xy(x + 1, y));
                indices.push(Tile.xy(x, y + 1));
            }

        // Create index buffer and assign it
        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        console.assert(indices.length === (tesselationSteps + 1) * (tesselationSteps + 1) * 6, "Invalid index buffer size");

        return indexBuffer;
    }

    private static xy(x: number, y: number) {
        return x + (tesselationSteps + 2) * y;
    }
}