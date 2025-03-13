import { DoubleVector3 } from "../../geometry/DoubleVector3";
import { RenderContext } from "../RenderContext";

export class Sphere {
    public vertexBuffer: WebGLBuffer;
    public indexBuffer: WebGLBuffer;
    public colorBuffer: WebGLBuffer;
    public numTriangles: number;

    constructor(protected context: RenderContext, public position: DoubleVector3, private radius: number, tesselation = 10) {

        const vertices: number[] = [];
        const colors: number[] = [];

        for (let v = 0; v <= tesselation; v++) {
            const aj = v * Math.PI / tesselation;
            const sj = Math.sin(aj);
            const cj = Math.cos(aj);

            for (let u = 0; u < tesselation; u++) {
                const ai = u * 2 * Math.PI / tesselation;
                const si = Math.sin(ai);
                const ci = Math.cos(ai);

                const x = si * sj;
                const y = cj;
                const z = ci * sj;

                colors.push(x);
                colors.push(y);
                colors.push(z);

                vertices.push(radius * x + position.x);
                vertices.push(radius * y + position.y);
                vertices.push(radius * z + position.z);
            }
        }

        this.vertexBuffer = context.gl!.createBuffer();
        context.gl?.bindBuffer(context.gl.ARRAY_BUFFER, this.vertexBuffer);
        context.gl?.bufferData(context.gl.ARRAY_BUFFER, new Float32Array(vertices), context.gl.STATIC_DRAW);

        this.colorBuffer = context.gl!.createBuffer();
        context.gl?.bindBuffer(context.gl.ARRAY_BUFFER, this.colorBuffer);
        context.gl?.bufferData(context.gl.ARRAY_BUFFER, new Float32Array(colors), context.gl.STATIC_DRAW);

        const indices: number[] = [];
        // Indices
        for (let j = 0; j < tesselation; j++) {
            for (let i = 0; i < tesselation; i++) {
                const p1 = j * tesselation + i;
                const p2 = p1 + tesselation;

                const p3 = (i + 1) % tesselation + j * tesselation;
                const p4 = (i + 1) % tesselation + j * tesselation + tesselation;

                indices.push(p1);
                indices.push(p2);
                indices.push(p3);

                indices.push(p3);
                indices.push(p2);
                indices.push(p4);
            }
        }

        this.numTriangles = indices.length / 3;

        this.indexBuffer = context.gl!.createBuffer();
        context.gl?.bindBuffer(context.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        context.gl?.bufferData(context.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), context.gl.STATIC_DRAW);
    }

    public destroy(context: RenderContext) {
        if (this.vertexBuffer)
            context.gl?.deleteBuffer(this.vertexBuffer);

        if (this.indexBuffer)
            context.gl?.deleteBuffer(this.indexBuffer);
    }

    public get boundingSphere() {
        return {
            center: this.position,
            radius: this.radius
        };
    }
}