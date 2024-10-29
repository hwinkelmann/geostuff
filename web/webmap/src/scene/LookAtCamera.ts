import { DoubleMatrix } from "../geometry/DoubleMatrix";
import { DoubleVector3 } from "../geometry/DoubleVector3";
import { Camera } from "./Camera";

export class LookAtCamera extends Camera {
    constructor(fov: number, canvas: React.RefObject<HTMLCanvasElement>, near: number, far: number, public position: DoubleVector3, public lookAt: DoubleVector3, private up: DoubleVector3) { 
        super(fov, canvas, 1, near, far);
    }

    protected getCameraPosition(): DoubleVector3 {
        return this.position;
    }

    protected getCameraMatrix(): DoubleMatrix {
        return DoubleMatrix.getLookAtMatrixRH(this.position, this.lookAt, this.up);
    }
}