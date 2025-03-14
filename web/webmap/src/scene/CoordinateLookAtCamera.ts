import { Coordinate } from "../geography/Coordinate";
import { Datum } from "../geography/Datum";
import { DoubleMatrix } from "../geometry/DoubleMatrix";
import { DoubleVector3 } from "../geometry/DoubleVector3";
import { Camera } from "./Camera";

export class CoordinateLookAtCamera extends Camera {
    private positionCoordinate: Coordinate;

    /**
     * @param fov Field of view in radians
     */
    constructor(fov: number, canvas: React.RefObject<HTMLCanvasElement>, near: number, far: number, position: Coordinate, public lookAt: Coordinate, private datum = Datum.WGS84) { 
        super(fov, canvas, 1, near, far);
        this.positionCoordinate = position;
    }

    public setPosition(coordinate: Coordinate) {
        this.positionCoordinate = coordinate;
    }

    public setLookAt(coordinate: Coordinate) {
        this.lookAt = coordinate;
    }

    public getCameraPosition(): DoubleVector3 {
        return this.datum.toCarthesian(this.positionCoordinate);
    }

    public getViewMatrix(): DoubleMatrix {
        super.aspect = (this.canvas.current?.width ?? 1) / (this.canvas.current?.height ?? 1);

        const lookAtCarthesian = this.datum.toCarthesian(this.lookAt);
        const positionCarthesian = this.getCameraPosition();

        return DoubleMatrix.getLookAtMatrixRH(positionCarthesian, lookAtCarthesian, positionCarthesian);
    }
}