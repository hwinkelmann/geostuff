import { DoubleMatrix } from "../geometry/DoubleMatrix";
import { DoubleVector3 } from "../geometry/DoubleVector3";
import { Ray3 } from "../geometry/Ray3";
import { deg2Rad } from "../rendering/Utils";
import { BoundingSphere } from "./BoundingSphere";
import { ClipPlane } from "./ClipPlane";

export abstract class Camera {
    public viewProjectionMatrix: DoubleMatrix = DoubleMatrix.Identity;

    /**
     * Projection matrix. Use only after calling update()
     */
    public projectionMatrix: DoubleMatrix = DoubleMatrix.Identity;

    /**
     * Camera position in world space. Use only after calling update()
     */
    public position: DoubleVector3 = new DoubleVector3(0, 0, 0);

    /**
     * View matrix. Use only after calling update()
     */
    public viewMatrix: DoubleMatrix = DoubleMatrix.Identity;

    /**
     * Inverse view matrix. Use only after calling update()
     */
    public invViewMatrix: DoubleMatrix = DoubleMatrix.Identity;

    /**
     * Inverse projection matrix. Use only after calling update()
     **/
    public invProjectionMatrix: DoubleMatrix = DoubleMatrix.Identity;

    /**
     * Clip planes that make up the view frustum. Use only after calling update()
     */
    public clipPlanes: ClipPlane[] = [];

    public constructor(public fov = deg2Rad(50), protected canvas: React.RefObject<HTMLCanvasElement>, public aspect = 1, public near = 0.1, public far = 2000) {
    }


    public getProjectionMatrix(): DoubleMatrix {
        return this.projectionMatrix;
    }

    /**
     * Matrix that transforms from world space to camera space. This needs
     * to be multiplied with the projection matrix to get the final view matrix.
     */
    public abstract getViewMatrix(): DoubleMatrix;

    /**
     * Returns the camera position in world space
     */
    public abstract getCameraPosition(): DoubleVector3;

    /**
     * Updates the view projection matrix as well as the clip planes
     */
    public update() {
        this.aspect = (this.canvas.current?.width ?? 1) / (this.canvas.current?.height || 1);
        this.position = this.getCameraPosition();
        this.projectionMatrix = DoubleMatrix.getProjectionMatrix(this.fov, this.aspect, this.near, this.far);
        this.viewMatrix = this.getViewMatrix();

        this.viewProjectionMatrix = DoubleMatrix.multiply(this.viewMatrix, this.projectionMatrix);

        this.invViewMatrix = this.viewMatrix.clone().invert();
        this.invProjectionMatrix = this.projectionMatrix.clone().invert();

        this.clipPlanes = this.constructClipPlanes();
    }

    /**
     * Calculates the ray that goes through the given pixel. The ray is in world space.
     * @param x Pixel x-coordinate
     * @param y Pixel y-coordinate
     * @returns World-space ray that goes through the pixel
     */
    public getRayForPixel(x: number, y: number): Ray3 {
        const width = this.canvas.current?.width ?? 1;
        const height = this.canvas.current?.height ?? 1;

        // Normalized device coordinates go from -1/-1 (bottom left) to 1/1 (top right)
        const xNDC = (2 * x) / width - 1;
        const yNDC = 1 - (2 * y) / height;

        const viewportVector = new DoubleVector3(xNDC, yNDC, -1);

        const direction = this.invProjectionMatrix.multiplyMatrixVector(viewportVector).normalize();
        direction.transform(this.invViewMatrix);

        return new Ray3(this.getCameraPosition(), direction);
    }

    /**
     * Builds the clip planes for the view frustum
     * @returns Clip planes that make up the view frustum
     */
    private constructClipPlanes(): ClipPlane[] {
        // This helped a lot:
        // https://learnopengl.com/Guest-Articles/2021/Scene/Frustum-Culling
        const halfVSide = this.far * Math.tan(this.fov / 2);
        const halfHSide = halfVSide * this.aspect;

        // Center of the screen in world space at the far point of frustum, so we can calculate the
        // screen corners at the far plane by adding/subtracting the up and right vectors multiplied
        // by half the screen size.
        const front = this.viewMatrix.getFrontVector().normalize();
        const right = this.viewMatrix.getRightVector().normalize();
        const up = this.viewMatrix.getUpVector().normalize();

        const frontMultFar = front.clone().multiply(this.far);

        const leftNormal = up.clone().cross(frontMultFar.clone().add(right.clone().multiply(halfHSide))).multiply(-1).normalize();
        const rightNormal = up.clone().cross(frontMultFar.clone().add(right.clone().multiply(-halfHSide))).normalize();
        const topNormal = right.clone().cross(frontMultFar.clone().add(up.clone().multiply(-halfVSide))).multiply(-1).normalize();
        const bottomNormal = right.clone().cross(frontMultFar.clone().add(up.clone().multiply(halfVSide))).normalize();

        const leftPlane = ClipPlane.fromPointAndNormal(leftNormal, this.position);
        const rightPlane = ClipPlane.fromPointAndNormal(rightNormal, this.position);
        const topPlane = ClipPlane.fromPointAndNormal(topNormal, this.position);
        const bottomPlane = ClipPlane.fromPointAndNormal(bottomNormal, this.position);
        const nearPlane = ClipPlane.fromPointAndNormal(front.clone(), this.position.clone().add(front.clone().multiply(-this.near)));
        const farPlane = ClipPlane.fromPointAndNormal(front.clone().multiply(-1), this.position.clone().add(front.clone().multiply(-this.far)));

        return [
            leftPlane,
            rightPlane,
            topPlane,
            bottomPlane,
            nearPlane,
            farPlane,
        ];
    }


    // Never got this working correctly, but something that is called once per frame
    // is not so very important right now. I'll leave it here for the future.
    /*
    private calculateClipPlanes(m: DoubleMatrix) {
        const frustumPlanes: ClipPlane[] = [
            new ClipPlane(new DoubleVector3(m.M14 + m.M11, m.M24 + m.M21, m.M34 + m.M31), m.M44 + m.M41),
            new ClipPlane(new DoubleVector3(m.M14 - m.M11, m.M24 - m.M21, m.M34 - m.M31), m.M44 - m.M41),
            new ClipPlane(new DoubleVector3(m.M14 + m.M12, m.M24 + m.M22, m.M34 + m.M32), m.M44 + m.M42),
            new ClipPlane(new DoubleVector3(m.M14 - m.M12, m.M24 - m.M22, m.M34 - m.M32), m.M44 - m.M42),
            new ClipPlane(new DoubleVector3(m.M14 + m.M13, m.M24 + m.M23, m.M34 + m.M33), m.M44 + m.M43),
            new ClipPlane(new DoubleVector3(m.M14 - m.M13, m.M24 - m.M23, m.M34 - m.M33), m.M44 - m.M43)
        ];
        return frustumPlanes;
    }
    */

    /**
     * Visibility test for a bounding sphere. Be sure camera.update() is called before!
     * @param volume Bounding sphere
     * @param clipPlanes Clip planes that make up the view frustum. Calculate these using calculateClipPlanes!
     * @returns true if the volume intersects with the view frustum, false otherwise
     */
    public isBoundingSphereVisible(volume: BoundingSphere) {
        for (const plane of this.clipPlanes) {
            // Get the signed distance from the relative point to the plane
            const distance = plane.getSignedDistance(volume.center);

            if (distance > volume.radius)
                return false;
        }
        return true;
    }
}
