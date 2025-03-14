import { Coordinate } from "../geography/Coordinate";
import { Datum } from "../geography/Datum";
import { DoubleMatrix } from "../geometry/DoubleMatrix";
import { DoubleVector3 } from "../geometry/DoubleVector3";
import { deg2Rad } from "../rendering/Utils";
import { Camera } from "./Camera";

export class FirstPersonCamera extends Camera {
    private rotation: DoubleMatrix = DoubleMatrix.Identity;

    public constructor(public fov = deg2Rad(50), protected canvas: React.RefObject<HTMLCanvasElement>, public aspect = 1, public near = 0.1, public far = 2000) {
        super(fov, canvas, 1, near, far);
        this.position = new DoubleVector3(0, 0, 0);
    }
    getCameraPosition() {
        return this.position;
    }
    getViewMatrix() {
        // return DoubleMatrix.getLookAtMatrixRH(this.position, this.lookAt, this.up);
        const translationMatrix = DoubleMatrix.getTranslationMatrix(-this.position.x, -this.position.y, -this.position.z);
        return this.rotation.multiply(translationMatrix);
    }

    setPositionByCoordinate(coord: Coordinate, datum = Datum.WGS84) {
        this.position = datum.toCarthesian(coord);
    }

    setLookAtByCoordinate(coord: Coordinate, datum = Datum.WGS84) {
        const lookAtCarthesian = datum.toCarthesian(coord);
        const lookAtMatrix = DoubleMatrix.getLookAtMatrixRH(this.position, lookAtCarthesian, this.position);

        this.rotation = lookAtMatrix.clone().resetTranslation();
    }

    move(relativeDirection: DoubleVector3) {
        const front = this.rotation.getFrontVector().multiply(relativeDirection.z);
        const right = this.rotation.getRightVector().multiply(relativeDirection.x);
        const up = this.rotation.getUpVector().multiply(relativeDirection.y);

        this.position = this.position.clone().add(front).add(right).add(up);
    }

    rotate(x: number, y: number, z: number) {
        const right = this.rotation.getRightVector();
        const up = this.rotation.getUpVector();

        const yRot = DoubleMatrix.getRotationMatrixQuaternion(right.multiply(y));
        const xRot = DoubleMatrix.getRotationMatrixQuaternion(up.multiply(x));

        const relativeRotation = xRot.multiply(yRot);
        this.rotation = this.rotation.multiply(relativeRotation);
    }
}