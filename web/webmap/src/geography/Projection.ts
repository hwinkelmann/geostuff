import { Coordinate } from "./Coordinate";
import { DoubleVector2 } from "../geometry/DoubleVector2";

export abstract class Projection {
    abstract project(coordinate: Coordinate): DoubleVector2;
    abstract unproject(point: DoubleVector2): Coordinate;

    public fromDescriptorCoordinate(x: number, y: number, zoom: number): Coordinate {
        const multiplier: number = Math.pow(2, zoom);

        x /= multiplier;
        y /= multiplier;

        return this.unproject(new DoubleVector2(x, y));
    }
}
