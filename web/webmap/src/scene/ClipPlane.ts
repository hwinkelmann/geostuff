import { DoubleVector3 } from "../geometry/DoubleVector3";

export class ClipPlane {
    public d: number;

    public normal: DoubleVector3;
    public point?: DoubleVector3;

    constructor(normal: DoubleVector3, d: number = 0) {
        const magnitude = normal.length();
        this.normal = normal.normalize();
        this.d = d / magnitude;
    }

    public getSignedDistance(point: DoubleVector3): number {
        return this.normal.dot(point) - this.d;
    }

    public static fromPointAndNormal(normal: DoubleVector3, point: DoubleVector3): ClipPlane {
        const d = -(normal.x * point.x + normal.y * point.y + normal.z * point.z);
        const result = new ClipPlane(normal, d);
        result.point = point;
        return result;
    }
}