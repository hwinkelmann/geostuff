import { DoubleVector3 } from "../../geometry/DoubleVector3";
import { RenderContext } from "../RenderContext";

export class Quad {
    public vertexBuffer: WebGLBuffer | null = null;
    public static textureBuffer: WebGLBuffer | null = null;

    constructor(context: RenderContext, public normal: DoubleVector3, public point: DoubleVector3, private size = 10, private textureReps = 10, private jiggle = 0.2) {
        this.init(context);
    }

    public destroy(context: RenderContext) {
        if (this.vertexBuffer) {
            context.gl.deleteBuffer(this.vertexBuffer);
            this.vertexBuffer = null;
        }
    }

    public init(context: RenderContext) {
        if (!Quad.textureBuffer) {
            Quad.textureBuffer = context.gl.createBuffer();
            if (!Quad.textureBuffer)
                throw new Error("Could not create vertex buffer");

            context.gl.bindBuffer(context.gl.ARRAY_BUFFER, Quad.textureBuffer);
            context.gl.bufferData(context.gl.ARRAY_BUFFER, new Float32Array([
                0.0, 0.0,
                0.0, 1.0,
                1.0, 0.0,
                1.0, 1.0,
                0.0, 1.0,
                1.0, 0.0,
            ].map(t => t * this.textureReps)), context.gl.STATIC_DRAW);
        }

        if (!this.vertexBuffer) {
            this.vertexBuffer = context.gl.createBuffer();
            if (!this.vertexBuffer)
                throw new Error("Could not create vertex buffer");

            // Determine a point on the plane
            const n = this.normal.clone();

            // Find two vectors that are perpendicular to n
            let v1 = new DoubleVector3(1, 0, 0);
            if (Math.abs(v1.dot(n)) > 0.9)
                v1 = new DoubleVector3(0, 1, 0);

            const v2 = n.cross(v1).normalize().multiply(this.size / 2);
            v1 = n.cross(v2).normalize().multiply(this.size / 2);

            // Construct twp points from that
            const p = new DoubleVector3(this.point.x + (Math.random() - 0.5) * this.jiggle, this.point.y + (Math.random() - 0.5) * this.jiggle, this.point.z + (Math.random() - 0.5) * this.jiggle);
            const p1 = p.clone().add(v1).add(v2);
            const p2 = p.clone().add(v1).subtract(v2);
            const p3 = p.clone().subtract(v1).add(v2);
            const p4 = p.clone().subtract(v1).subtract(v2);

            const vertices = [
                p1.x, p1.y, p1.z,
                p2.x, p2.y, p2.z,
                p3.x, p3.y, p3.z,
                p4.x, p4.y, p4.z,
                p2.x, p2.y, p2.z,
                p3.x, p3.y, p3.z,
            ];

            context.gl.bindBuffer(context.gl.ARRAY_BUFFER, this.vertexBuffer);
            context.gl.bufferData(context.gl.ARRAY_BUFFER, new Float32Array(vertices), context.gl.STATIC_DRAW);
        }
    }
}