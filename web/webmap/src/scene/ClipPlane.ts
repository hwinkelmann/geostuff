import { DoubleVector3 } from "../geometry/DoubleVector3";

export class ClipPlane {

    constructor(public a: number, public b: number, public c: number, public d: number) {
    }

    public dot(point: DoubleVector3): number {
        return this.a * point.x + this.b * point.y + this.c * point.z + this.d;
    }
}