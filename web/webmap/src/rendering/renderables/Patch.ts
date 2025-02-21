import { BoundingBox } from "../../geography/BoundingBox";
import { Coordinate } from "../../geography/Coordinate";
import { Datum } from "../../geography/Datum";
import { DoubleVector3 } from "../../geometry/DoubleVector3";
import { RenderContext } from "../RenderContext";

export class Patch {
    // WebGL index buffer
    public triCount: number = 0;

    public indexBuffer: WebGLBuffer | null = null;
    public vertexBuffer: WebGLBuffer | null = null;
    public textureBuffer: WebGLBuffer | null = null;

    public texture: WebGLTexture | null = null;

    public boundingSphere: {
        center: DoubleVector3,
        radius: number,
    } = {
        center: new DoubleVector3(0, 0, 0),
        radius: 0,
    };

    constructor(protected context: RenderContext, protected tesselationSteps = 45, protected datum = Datum.SmallDebug) {
        this.init();
    }

    public init() {
        const gl = this.context.gl;

        // Create index-, vertex- and texture coordinate buffers
        this.indexBuffer = Patch.buildIndexBuffer(gl, this.tesselationSteps);

        // TODO: FIX BOUNDS
        const bounds = BoundingBox.fromCoordinates([
            new Coordinate(90, -180),
            new Coordinate(-90, 180),
        ])!;

        const vb = Patch.buildVertexBuffer(gl, bounds, this.tesselationSteps, this.datum);

        this.vertexBuffer = vb.vertexBuffer;
        this.boundingSphere = vb.boundingSphere;

        this.textureBuffer = Patch.buildTextureBuffer(gl, this.tesselationSteps);

        this.triCount = (this.tesselationSteps + 1) * (this.tesselationSteps + 1) * 2;
    }

    // TODO: THIS IS A MOCK
    private static buildTextureBuffer(gl: WebGL2RenderingContext, tesselationSteps: number) {
        const textureCoordinates: number[] = [];
        for (let y = -1; y <= tesselationSteps; y++) {
            for (let x = -1; x <= tesselationSteps; x++) {
                const xt = Math.max(0, Math.min(tesselationSteps, x));
                const yt = Math.max(0, Math.min(tesselationSteps, y));

                textureCoordinates.push(xt);
                textureCoordinates.push(yt);
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
        const boundingSphere = Patch.getBoundingSphere(vertices);

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
                indices.push(Patch.xy(x, y, tesselationSteps));
                indices.push(Patch.xy(x, y + 1, tesselationSteps));
                indices.push(Patch.xy(x + 1, y, tesselationSteps));
                indices.push(Patch.xy(x + 1, y + 1, tesselationSteps));
                indices.push(Patch.xy(x + 1, y, tesselationSteps));
                indices.push(Patch.xy(x, y + 1, tesselationSteps));
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
}