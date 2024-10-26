import { Coordinate } from "../geography/Coordinate";
import { Datum } from "../geography/Datum";
import { DoubleMatrix } from "../geometry/DoubleMatrix";
import { DoubleVector3 } from "../geometry/DoubleVector3";
import { Camera } from "./Camera";

export class CoordinateLookAtCamera extends Camera {
    constructor(fov: number, private canvas: React.RefObject<HTMLCanvasElement>, near: number, far: number, public position: Coordinate, public lookAt: Coordinate, private datum = Datum.WGS84) { 
        super(fov, 1, near, far);
    }

    public getCameraPosition(): DoubleVector3 {
        return this.datum.toCarthesian(this.position);
    }

    public getCameraMatrix(): DoubleMatrix {
        super.aspect = (this.canvas.current?.width ?? 1) / (this.canvas.current?.height ?? 1);

        const lookAtCarthesian = this.datum.toCarthesian(this.lookAt);
        const positionCarthesian = this.getCameraPosition();

        const viewMatrix = DoubleMatrix.getLookAtMatrixRH(positionCarthesian, lookAtCarthesian, positionCarthesian);
        return viewMatrix;
    }
}