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

    /**
     * Calculates the carthesian coordinates from a given coordinate.
     * The coordinate system is as follows:
     * 
     * z-axis goes through poles (+ is north, - south)
     * x-axis goes through 0/0 (0 is prime meridian, positive is east, negative is west)
     * y-axis is perpendicular to x and z, and goes through 0/90 (positive) and 0/-90 (negative)
     * @param coordinate Coordinate to convert
     * @returns Carthesian coordinate
     */
    public toCarthesian(coordinate: Coordinate): DoubleVector3 {
        const radLat = (Math.PI / 180) * coordinate.latitude;
        const radLon = (Math.PI / 180) * coordinate.longitude;

        const N = this.radiusOfCurvature(coordinate.latitude);

        const result = new DoubleVector3();
        const elevation = coordinate.elevation ?? 0;
        result.x = ((N + elevation) * Math.cos(radLat) * Math.cos(radLon) + this.xShift);
        result.y = ((N + elevation) * Math.cos(radLat) * Math.sin(radLon) + this.yShift);
        result.z = ((((this.b * this.b * N) / (this.a * this.a)) + elevation) * Math.sin(radLat) + this.zShift);

        return result;
    }

    /**
     * Calculates the distance between two coordinates. Beware that this is a straight 
     * line distance, not a distance along the surface.
     * @param from First coordinate
     * @param to Second coordinate
     * @returns Distance between the two coordinates
     */
    public distance(from: Coordinate, to: Coordinate): number {
        const diff = this.toCarthesian(from).subtract(this.toCarthesian(to));
        return diff.length();
    }

    /**
     * Converts a Cartesian coordinate to a geographic coordinate (latitude, longitude, elevation).
     * 
     * @param pos - The Cartesian coordinate to convert.
     * @returns The geographic coordinate corresponding to the given Cartesian coordinate.
     */
    public fromCarthesian(pos: DoubleVector3): Coordinate {
        const coord = new Coordinate();

        const position = new DoubleVector3(pos.x - this.xShift, pos.y - this.yShift, pos.z - this.zShift);

        // Calculate longitude
        coord.longitude = Math.atan2(position.y, position.x) * 180.0 / Math.PI;

        // Calculate intermediate values
        const p = Math.sqrt(position.x * position.x + position.y * position.y);
        const theta = Math.atan2(position.z * this.a, p * this.b);
        const phi = Math.atan2(position.z + this.e_ * this.e_ * this.b * Math.pow(Math.sin(theta), 3), p - this.e * this.e * this.a * Math.pow(Math.cos(theta), 3));

        // Calculate latitude
        coord.latitude = phi * 180.0 / Math.PI;

        // Calculate elevation
        const N = this.radiusOfCurvature(coord.latitude);
        coord.elevation = p / Math.cos(phi) - N;

        return coord;
    }
    
    protected radiusOfCurvature(latitude: number): number {
        return this.a / Math.sqrt(1 - this.e * this.e * Math.pow(Math.sin(latitude * Math.PI / 180.0), 2));
    }

    public get meridianLength() {
        return Math.PI * 2 * this.a;
    }
}
