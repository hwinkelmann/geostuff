import { Coordinate } from "./Coordinate";
import { DoubleVector2 } from "../geometry/DoubleVector2";

export interface Projection {
        project(coordinate: Coordinate): DoubleVector2;
        unproject(point: DoubleVector2): Coordinate;
}
