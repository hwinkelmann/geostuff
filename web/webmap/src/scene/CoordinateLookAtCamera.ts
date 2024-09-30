import { Coordinate } from "../geography/Coordinate";
import { Datum } from "../geography/Datum";
import { DoubleMatrix } from "../geometry/DoubleMatrix";
import { DoubleVector3 } from "../geometry/DoubleVector3";
import { Camera } from "./Camera";

export class CoordinateLookAtCamera extends Camera {
    constructor(fov: number, aspect: number, near: number, far: number, public position: Coordinate, public lookAt: Coordinate) { 
        super(fov, aspect, near, far);
    }

    public getCameraPosition(): DoubleVector3 {
        return Datum.WGS84.toCarthesian(this.position);
    }

    public getCameraMatrix(): DoubleMatrix {
        const lookAtCarthesian = Datum.WGS84.toCarthesian(this.lookAt);
        const positionCarthesian = this.getCameraPosition();


        const front = lookAtCarthesian.subtract(positionCarthesian);

        const right = front.cross(positionCarthesian);
        const up = right.cross(front);

        up.normalize();
        front.normalize();
        right.normalize();

        //const viewMatrix = DoubleMatrix.CreateLookAt(Vector3.Zero, front, up);
        // return viewMatrix;

        return DoubleMatrix.Identity;
    }
}