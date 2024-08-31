import { DoubleVector2 } from "../geometry/DoubleVector2";
import { Coordinate } from "./Coordinate";
import { Projection } from "./Projection";

export class MercatorProjection implements Projection {
    public project(coordinate: Coordinate): DoubleVector2 {
        const latRad: number = (coordinate.latitude * Math.PI) / 180.0;

        const result: DoubleVector2 = new DoubleVector2();
        result.x = (coordinate.longitude + 180.0) / 360.0;
        result.y = (1 - Math.log(Math.tan(latRad) + 1.0 / Math.cos(latRad)) / Math.PI) / 2;

        return result;
    }

    public unproject(point: DoubleVector2): Coordinate {
        const xNom: number = Math.exp(2 * Math.PI) - Math.exp(4 * Math.PI * point.y);
        const xDen: number = Math.exp(2 * Math.PI) + Math.exp(4 * Math.PI * point.y);

        const yNom: number = 2 * Math.exp(-Math.PI * (-1 + 2 * point.y));
        const yDen: number = Math.exp(-2 * Math.PI * (-1 + 2 * point.y)) + 1;

        const result: Coordinate = new Coordinate();
        result.latitude = (Math.atan2(xNom / xDen, yNom / yDen) * 180.0) / Math.PI;
        result.longitude = -180.0 + 360.0 * point.x;

        return result;
    }

    public toDescriptorCoordinate(coordinate: Coordinate, zoom: number): DoubleVector2 {
        const result: DoubleVector2 = this.project(coordinate);

        const multiplier: number = Math.pow(2, zoom);

        result.x *= multiplier;
        result.y *= multiplier;

        return result;
    }

    public fromDescriptorCoordinate(x: number, y: number, zoom: number): Coordinate {
        const multiplier: number = Math.pow(2, zoom);

        x /= multiplier;
        y /= multiplier;

        return this.unproject(new DoubleVector2(x, y));
    }
}