import { DoubleVector3 } from "../geometry/DoubleVector3";

/**
 * Represents a clipping plane in 3D space.
 * 
 * @remarks
 * The `ClipPlane` class defines a plane using a normal vector and a distance from the origin.
 * It provides methods to calculate the signed distance from a point to the plane and to create a plane 
 * from a point and a normal vector.
 * 
 * @example
 * ```typescript
 * const normal = new DoubleVector3(1, 0, 0);
 * const clipPlane = new ClipPlane(normal, 10);
 * const point = new DoubleVector3(5, 0, 0);
 * const distance = clipPlane.getSignedDistance(point);
 * console.log(distance); // Output will be the signed distance from the point to the plane
 * ```
 * 
 * @public
 */
export class ClipPlane {
    public d: number;

    public normal: DoubleVector3;

    /**
     * Creates an instance of the ClipPlane class.
     * 
     * @param normal - The normal vector of the plane. It is expected to be a DoubleVector3.
     * @param d - The distance from the origin to the plane along the normal vector. Defaults to 0.
     * 
     * @remarks
     * The constructor normalizes the normal vector and adjusts the distance `d` accordingly.
     * 
     * @example
     * ```typescript
     * const normal = new DoubleVector3(1, 0, 0);
     * const clipPlane = new ClipPlane(normal, 10);
     * ```
     */
    constructor(normal: DoubleVector3, d: number = 0) {
        const magnitude = normal.length();
        this.normal = normal.normalize();
        this.d = d / magnitude;
    }

    /**
     * Returns the signed distance from the plane to a point.
     * @param point Point to calculate the distance to
     * @returns Distance from the plane to the point
     */
    public getSignedDistance(point: DoubleVector3): number {
        return this.normal.dot(point) - this.d;
    }


    public static fromPointAndNormal(normal: DoubleVector3, point: DoubleVector3): ClipPlane {
        return new ClipPlane(
            normal, 
            normal.x * point.x + normal.y * point.y + normal.z * point.z,
        );
    }
}