import { DoubleVector3 } from "../geometry/DoubleVector3";
import { Coordinate } from "./Coordinate";

export class Datum {
    public static WGS84: Datum = new Datum(6378137, 1.0 / 298.257223563, 0, 0, 0);

    public static SmallDebug: Datum = new Datum(1000, 1.0 / 298.257223563, 0, 0, 0);

    protected a: number;
    protected b: number;
    protected e: number;
    protected e_: number;
    protected f: number;
    protected xShift: number;
    protected yShift: number;
    protected zShift: number;

    constructor(a: number, f: number, xShift: number, yShift: number, zShift: number) {
        this.a = a;
        this.f = f;
        this.b = a * (1 - f);
        this.xShift = xShift;
        this.yShift = yShift;
        this.zShift = zShift;

        this.e = Math.sqrt((a * a - this.b * this.b) / (a * a));
        this.e_ = Math.sqrt((a * a - this.b * this.b) / (this.b * this.b));
    }

    public toCarthesian(coordinate: Coordinate): DoubleVector3 {
        const radLat = (Math.PI / 180) * coordinate.latitude;
        const radLon = (Math.PI / 180) * coordinate.longitude;

        const N = this.radiusOfCurvature(coordinate.latitude);

        // z und y vertauscht und dann x und z

        // x => z, y => x, z => y

        const result = new DoubleVector3();
        result.z = ((N + (coordinate.elevation ?? 0)) * Math.cos(radLat) * Math.cos(radLon) + this.xShift);
        result.x = ((N + (coordinate.elevation ?? 0)) * Math.cos(radLat) * Math.sin(radLon) + this.yShift);
        result.y = (((this.b * this.b * N) / (this.a * this.a)) * Math.sin(radLat) + this.zShift);

        return result;
    }

    public distance(from: Coordinate, to: Coordinate): number {
        const diff = this.toCarthesian(from).subtract(this.toCarthesian(to));
        return diff.length();
    }

    public fromCarthesian(position: DoubleVector3): Coordinate {
        const coord = new Coordinate();

        // Apply inverse shifts
        const x = position.x - this.yShift;
        const y = position.y - this.zShift;
        const z = position.z - this.xShift;

        // Calculate longitude
        coord.longitude = Math.atan2(x, z) * 180.0 / Math.PI;

        // Calculate intermediate values
        const p = Math.sqrt(z * z + x * x);
        const theta = Math.atan2(y * this.a, p * this.b);

        // Calculate latitude
        const phi = Math.atan2(y + this.e_ * this.e_ * this.b * Math.pow(Math.sin(theta), 3), p - this.e * this.e * this.a * Math.pow(Math.cos(theta), 3));
        coord.latitude = phi * 180.0 / Math.PI;

        // Calculate elevation
        const N = this.radiusOfCurvature(coord.latitude);
        coord.elevation = p / Math.cos(phi) - N;

        return coord;
    }

    protected radiusOfCurvature(latitude: number): number {
        return this.a / Math.sqrt(1 - this.e * this.e * Math.pow(Math.sin(latitude * Math.PI / 180.0), 2));
    }
}
