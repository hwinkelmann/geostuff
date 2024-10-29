import { DoubleMatrix } from "../geometry/DoubleMatrix";
import { DoubleVector3 } from "../geometry/DoubleVector3";
import { BoundingSphere } from "./BoundingSphere";
import { ClipPlane } from "./ClipPlane";

export abstract class Camera {
    public viewProjectionMatrix: DoubleMatrix = DoubleMatrix.Identity;

    public clipPlanes: ClipPlane[] = [];

    public projectionMatrix: DoubleMatrix = DoubleMatrix.Identity;

    public position: DoubleVector3 = new DoubleVector3(0, 0, 0);

    public viewMatrix: DoubleMatrix = DoubleMatrix.Identity;

    public constructor(public fov: number, private canvas: React.RefObject<HTMLCanvasElement>, public aspect: number, public near: number, public far: number) {
    }


    /**
     * Matrix that transforms from world space to camera space. This needs
     * to be multiplied with the projection matrix to get the final view matrix.
     */
    protected abstract getCameraMatrix(): DoubleMatrix;

    /**
     * Returns the camera position in world space
     */
    protected abstract getCameraPosition(): DoubleVector3;

    /**
     * Updates the view projection matrix as well as the clip planes
     */
    public update() {
        this.aspect = (this.canvas.current?.width ?? 1) / (this.canvas.current?.height || 1);
        this.position = this.getCameraPosition();
        this.projectionMatrix = DoubleMatrix.getProjectionMatrix(this.fov, this.aspect, this.near, this.far);
        this.viewMatrix = this.getCameraMatrix();

        this.viewProjectionMatrix = DoubleMatrix.multiply(this.projectionMatrix, this.viewMatrix);

        this.clipPlanes = calculateClipPlanes(this.viewProjectionMatrix);
    }
}

/**
 * Calculates clip planes for frustum culling
 * @param viewProjectionMatrix View projection matrix
 * @returns Clip planes
 */
export function calculateClipPlanes(viewProjectionMatrix: DoubleMatrix)
{
    const frustrumPlanes: ClipPlane[] = [
        new ClipPlane(viewProjectionMatrix.M14 + viewProjectionMatrix.M11, viewProjectionMatrix.M24 + viewProjectionMatrix.M21, viewProjectionMatrix.M34 + viewProjectionMatrix.M31, viewProjectionMatrix.M44 + viewProjectionMatrix.M41),
        new ClipPlane(viewProjectionMatrix.M14 - viewProjectionMatrix.M11, viewProjectionMatrix.M24 - viewProjectionMatrix.M21, viewProjectionMatrix.M34 - viewProjectionMatrix.M31, viewProjectionMatrix.M44 - viewProjectionMatrix.M41),
        new ClipPlane(viewProjectionMatrix.M14 + viewProjectionMatrix.M12, viewProjectionMatrix.M24 + viewProjectionMatrix.M22, viewProjectionMatrix.M34 + viewProjectionMatrix.M32, viewProjectionMatrix.M44 + viewProjectionMatrix.M42),
        new ClipPlane(viewProjectionMatrix.M14 - viewProjectionMatrix.M12, viewProjectionMatrix.M24 - viewProjectionMatrix.M22, viewProjectionMatrix.M34 - viewProjectionMatrix.M32, viewProjectionMatrix.M44 - viewProjectionMatrix.M42),
        new ClipPlane(viewProjectionMatrix.M13, viewProjectionMatrix.M23, viewProjectionMatrix.M33, viewProjectionMatrix.M43),
        new ClipPlane(viewProjectionMatrix.M14 - viewProjectionMatrix.M13, viewProjectionMatrix.M24 - viewProjectionMatrix.M23, viewProjectionMatrix.M34 - viewProjectionMatrix.M33, viewProjectionMatrix.M44 - viewProjectionMatrix.M43)
    ];

    // Normalize planes
    for (let i = 0; i < 6; i++)
    {
        const magnitude = Math.sqrt(frustrumPlanes[i].a * frustrumPlanes[i].a +
                                    frustrumPlanes[i].b * frustrumPlanes[i].b +
                                    frustrumPlanes[i].c * frustrumPlanes[i].c);

        frustrumPlanes[i].a /= magnitude;
        frustrumPlanes[i].b /= magnitude;
        frustrumPlanes[i].c /= magnitude;
        frustrumPlanes[i].d /= magnitude;
    }

    return frustrumPlanes;
}

/**
 * Visibility test for a bounding sphere
 * @param volume Bounding sphere
 * @param cameraPosition Camera position in world space
 * @param clipPlanes Clip planes that make up the view frustum. Calculate these using calculateClipPlanes!
 * @returns true if the volume intersects with the view frustum, false otherwise
 */
export function isVisible(volume: BoundingSphere, cameraPosition: DoubleVector3, clipPlanes: ClipPlane[])
{
    for (const plane of clipPlanes) {
        const distance = plane.dot(
            new DoubleVector3(volume.center.x, volume.center.y, volume.center.z).subtract(cameraPosition));

        if ((distance + volume.radius) < 0)
            return false;
    }

    return true;
}