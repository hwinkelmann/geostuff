import { Camera } from "../../scene/Camera";
import { RenderContext } from "../RenderContext";
import { setBuffers } from "../Utils";

export class Frustum {
    private vertexBuffer: WebGLBuffer | null = null;
    private colorBuffer: WebGLBuffer | null = null;

    constructor(context: RenderContext, camera: Camera) {
        this.init(context, camera);
    }

    public destroy(context: RenderContext) {
        if (this.vertexBuffer) {
            context.gl?.deleteBuffer(this.vertexBuffer);
            this.vertexBuffer = null;
        }

        if (this.colorBuffer) {
            context.gl?.deleteBuffer(this.colorBuffer);
            this.colorBuffer = null
        }
    }

    public init(context: RenderContext, camera: Camera) {
        if (!this.vertexBuffer) {
            this.vertexBuffer = context.gl!.createBuffer();
            if (!this.vertexBuffer)
                throw new Error("Could not create vertex buffer");

            const halfVSideFar = camera.far * Math.tan(camera.fov / 2);
            const halfHSideFar = halfVSideFar * camera.aspect;
            const halfVSideNear = camera.near * Math.tan(camera.fov / 2);
            const halfHSideNear = halfVSideNear * camera.aspect;

            // Center of the screen in world space at the far point of frustum, so we can calculate the
            // screen corners at the far plane by adding/subtracting the up and right vectors multiplied
            // by half the screen size.
            const viewMatrix = camera.getViewMatrix().clone();
            const front = viewMatrix.getFrontVector().normalize();
            const right = viewMatrix.getRightVector().normalize();
            const up = viewMatrix.getUpVector().normalize();

            const farCenter = camera.position.clone().add(front.clone().multiply(-camera.far));
            const nearCenter = camera.position.clone().add(front.clone().multiply(-camera.near));

            const blf = farCenter.clone().add(right.clone().multiply(-halfHSideFar)).add(up.clone().multiply(-halfVSideFar));
            const brf = farCenter.clone().add(right.clone().multiply(halfHSideFar)).add(up.clone().multiply(-halfVSideFar));
            const tlf = farCenter.clone().add(right.clone().multiply(-halfHSideFar)).add(up.clone().multiply(halfVSideFar));
            const trf = farCenter.clone().add(right.clone().multiply(halfHSideFar)).add(up.clone().multiply(halfVSideFar));

            const bln = nearCenter.clone().add(right.clone().multiply(-halfHSideNear)).add(up.clone().multiply(-halfVSideNear));
            const brn = nearCenter.clone().add(right.clone().multiply(halfHSideNear)).add(up.clone().multiply(-halfVSideNear));
            const tln = nearCenter.clone().add(right.clone().multiply(-halfHSideNear)).add(up.clone().multiply(halfVSideNear));
            const trn = nearCenter.clone().add(right.clone().multiply(halfHSideNear)).add(up.clone().multiply(halfVSideNear));

            const vertices = [
                bln, blf, tlf, bln, tlf, tln, // left 
                brn, brf, trf, brn, trf, trn, // right
                bln, brn, trn, bln, trn, tln, // near
                blf, brf, trf, blf, trf, tlf, // far
                tln, trn, trf, tln, trf, tlf, // top
                bln, brn, brf, bln, brf, blf, // bottom
            ].flatMap(v => [v.x, v.y, v.z]);



            context.gl?.bindBuffer(context.gl.ARRAY_BUFFER, this.vertexBuffer);
            context.gl?.bufferData(context.gl.ARRAY_BUFFER, new Float32Array(vertices), context.gl.STATIC_DRAW);
        }

        if (!this.colorBuffer) {
            this.colorBuffer = context.gl!.createBuffer();
            if (!this.colorBuffer)
                throw new Error("Could not create color buffer");


            const left = [1, 0, 0];
            const right = [0, 1, 0];
            const top = [0, 0, 1];
            const bottom = [1, 1, 0];
            const near = [1, 0, 1];
            const far = [0, 1, 1];


            const colors = [left, right, top, bottom, near, far];

            const colorData: number[] = [];

            for (let i = 0; i < colors.length; i++) {
                for (let j = 0; j < 6; j++)
                    colorData.push(...colors[i]);
            }

            context.gl?.bindBuffer(context.gl.ARRAY_BUFFER, this.colorBuffer);
            context.gl?.bufferData(context.gl.ARRAY_BUFFER, new Float32Array(colorData), context.gl.STATIC_DRAW);
        }
    }

    public render(context: RenderContext, gouraudProgram: WebGLProgram) {
        context.gl?.disable(context.gl.CULL_FACE);
        setBuffers(context, gouraudProgram!, {
            vertexBuffer: this.vertexBuffer!,
            colorBuffer: this.colorBuffer,
        });

        context.gl?.drawArrays(context.gl.TRIANGLES, 0, 6 * 6);
    }
}