import { DoubleVector3 } from "./DoubleVector3";

export class Ray3 {
    constructor(public origin: DoubleVector3, public direction: DoubleVector3) {
    }

    public getPointAt(t: number): DoubleVector3 {
        return this.origin.clone().add(this.direction.clone().multiply(t));
    }
}