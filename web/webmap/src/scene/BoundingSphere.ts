import { DoubleVector3 } from "../geometry/DoubleVector3";

export class BoundingSphere {
    constructor(public center: DoubleVector3, public radius: number) {
    }
}