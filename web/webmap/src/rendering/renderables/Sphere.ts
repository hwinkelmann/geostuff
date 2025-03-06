import { DoubleVector3 } from "../../geometry/DoubleVector3";
import { RenderContext } from "../RenderContext";

export class Sphere {
    public vertexBuffer: WebGLBuffer;
    public indexBuffer: WebGLBuffer;

    constructor(protected context: RenderContext, position: DoubleVector3, radius: number, tesselation = 10) {

        const vertices: number[] = [];

        for (let v = 0; v < tesselation; v++)
            for (let u = 0; u < tesselation; u++) {
                const fu = u / tesselation;
                const fv = v / tesselation;

                vertices.push(position.x + radius * Math.cos(2 * Math.PI * fu) * Math.sin(Math.PI * fv));
                vertices.push(position.y + radius * Math.sin(2 * Math.PI * fu) * Math.sin(Math.PI * fv));
                vertices.push(position.z + radius * Math.cos(Math.PI * fv));
            }

        this.vertexBuffer = context.gl!.createBuffer();
        context.gl?.bindBuffer(context.gl.ARRAY_BUFFER, this.vertexBuffer);
        context.gl?.bufferData(context.gl.ARRAY_BUFFER, new Float32Array(vertices), context.gl.STATIC_DRAW);

        const indices: number[] = [];
        for (let u = 0; u <= tesselation; u++)
            for (let v = 0; v < tesselation - 1; v++) {

                const a = (u % tesselation) + v * tesselation;
                const b = ((u + 1) % tesselation) + v * tesselation;
                const c = (u % tesselation) + (v + 1) * tesselation;
                const d = ((u + 1) % tesselation) + (v + 1) * tesselation;

                indices.push(a);
                indices.push(b);
                indices.push(c);

                indices.push(b);
                indices.push(c);
                indices.push(d);
            }

        this.indexBuffer = context.gl!.createBuffer();
        context.gl?.bindBuffer(context.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        context.gl?.bufferData(context.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), context.gl.STATIC_DRAW);
    }

    public render() {

    }
}