import { DoubleMatrix } from "../geometry/DoubleMatrix";
import { DoubleVector3 } from "../geometry/DoubleVector3";
import { deg2Rad } from "../rendering/Utils";
import { BoundingSphere } from "./BoundingSphere";
import { ClipPlane } from "./ClipPlane";

export abstract class Camera {
    public viewProjectionMatrix: DoubleMatrix = DoubleMatrix.Identity;

    public projectionMatrix: DoubleMatrix = DoubleMatrix.Identity;

    public position: DoubleVector3 = new DoubleVector3(0, 0, 0);

    public viewMatrix: DoubleMatrix = DoubleMatrix.Identity;

    public constructor(public fov = deg2Rad(50), protected canvas: React.RefObject<HTMLCanvasElement>, public aspect = 1, public near = 0.1, public far = 2000) {
    }


    public getProjectionMatrix(): DoubleMatrix {
        return this.projectionMatrix;
    }

    /**
     * Matrix that transforms from world space to camera space. This needs
     * to be multiplied with the projection matrix to get the final view matrix.
     */
    protected abstract getViewMatrix(): DoubleMatrix;

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
        this.viewMatrix = this.getViewMatrix();

        this.viewProjectionMatrix = DoubleMatrix.multiply(this.viewMatrix, this.projectionMatrix);
    }
}

export function constructClipPlanes(camera: Camera): ClipPlane[] {
    // This helped a lot:
    // https://learnopengl.com/Guest-Articles/2021/Scene/Frustum-Culling
    const halfVSide = camera.far * Math.tan(camera.fov / 2);
    const halfHSide = halfVSide * camera.aspect;

    // Center of the screen in world space at the far point of frustum, so we can calculate the
    // screen corners at the far plane by adding/subtracting the up and right vectors multiplied
    // by half the screen size.
    const front = camera.viewMatrix.getFrontVector().normalize();
    const right = camera.viewMatrix.getRightVector().normalize();
    const up = camera.viewMatrix.getUpVector().normalize();

    const frontMultFar = front.clone().multiply(camera.far);

    const leftNormal = up.clone().cross(frontMultFar.clone().add(right.clone().multiply(halfHSide))).normalize();
    const rightNormal = up.clone().cross(frontMultFar.clone().add(right.clone().multiply(-halfHSide))).normalize();
    const topNormal = right.clone().cross(frontMultFar.clone().add(up.clone().multiply(-halfVSide))).normalize();
    const bottomNormal = right.clone().cross(frontMultFar.clone().add(up.clone().multiply(halfVSide))).normalize();

    const leftPlane = ClipPlane.fromPointAndNormal(leftNormal, camera.position);
    const rightPlane = ClipPlane.fromPointAndNormal(rightNormal, camera.position);
    const topPlane = ClipPlane.fromPointAndNormal(topNormal, camera.position);
    const bottomPlane = ClipPlane.fromPointAndNormal(bottomNormal, camera.position);
    const nearPlane = ClipPlane.fromPointAndNormal(front.clone().multiply(-1), camera.position.clone().add(front.clone().multiply(-camera.near)));
    const farPlane = ClipPlane.fromPointAndNormal(front.clone(), camera.position.clone().add(front.clone().multiply(-camera.far)));

    return [
        leftPlane,
        rightPlane,
        topPlane,
        bottomPlane,
        nearPlane,
        farPlane,
    ];
}


// // Never got this working correctly
// export function calculateClipPlanes(m: DoubleMatrix) {
//     const frustumPlanes: ClipPlane[] = [
//         new ClipPlane(m.M14 + m.M11, m.M24 + m.M21, m.M34 + m.M31, m.M44 + m.M41),
//         new ClipPlane(m.M14 - m.M11, m.M24 - m.M21, m.M34 - m.M31, m.M44 - m.M41),
//         new ClipPlane(m.M14 + m.M12, m.M24 + m.M22, m.M34 + m.M32, m.M44 + m.M42),
//         new ClipPlane(m.M14 - m.M12, m.M24 - m.M22, m.M34 - m.M32, m.M44 - m.M42),
//         new ClipPlane(m.M14 + m.M13, m.M24 + m.M23, m.M34 + m.M33, m.M44 + m.M43),
//         new ClipPlane(m.M14 - m.M13, m.M24 - m.M23, m.M34 - m.M33, m.M44 - m.M43)
//     ];

//     return frustumPlanes;
// }

/**
 * Visibility test for a bounding sphere
 * @param volume Bounding sphere
 * @param clipPlanes Clip planes that make up the view frustum. Calculate these using calculateClipPlanes!
 * @returns true if the volume intersects with the view frustum, false otherwise
 */
export function isVisible(volume: BoundingSphere, clipPlanes: ClipPlane[]) {
    const distances: number[] = [];
    for (const plane of clipPlanes) {
        // const distance = plane.dot(volume.center); //new DoubleVector3(volume.center.x, volume.center.y, volume.center.z).subtract(cameraPosition));
        const distance = plane.getSignedDistance(volume.center);
        distances.push(distance);
    }

    const tabData = [];
    const planeNames = ["left", "right", "bottom", "top", "near", "far"];
    for (let i = 0; i < 6; i++) {
        tabData.push({
            plane: planeNames[i],
            isWithin: (distances[i] + volume.radius) >= 0,
            distance: distances[i],
            normal: clipPlanes[i].normal,
            point: clipPlanes[i].point,
            d: clipPlanes[i].d,
        })
    }

    // console.table(tabData);

    // console.log("Volume radius:", volume.radius);
    // console.log("Camera position:", cameraPosition);
    // console.log("Volume center:", volume.center);

    return distances.every((d) => d - volume.radius <= 0);
}