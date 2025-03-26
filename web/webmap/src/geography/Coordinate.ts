export class Coordinate {
    constructor(public latitude: number = 0, public longitude: number = 0, public elevation?: number) {
    }

    public bearingTo(coordinate: Coordinate): number {
        return Coordinate.bearingTo(this.latitude, this.longitude, coordinate.latitude, coordinate.longitude);
    }

    /**
     * Calculate the bearing between two coordinates
     * @returns the bearing in degrees
     */

    public static bearingTo(fromLatitude: number, fromLongitude: number, toLatitude: number, toLongitude: number): number {
        if (fromLatitude === toLatitude && fromLongitude === toLongitude) {
            return 0;
        }

        const latFromRad = fromLatitude * Math.PI / 180.0;
        const latToRad = toLatitude * Math.PI / 180.0;
        const lonFromRad = fromLongitude * Math.PI / 180.0;
        const lonToRad = toLongitude * Math.PI / 180.0;

        const x = Math.cos(latFromRad) * Math.sin(latToRad) - Math.sin(latFromRad) * Math.cos(latToRad) * Math.cos(lonFromRad - lonToRad);
        const y = -Math.sin(lonFromRad - lonToRad) * Math.cos(latToRad);

        return (Math.atan2(y, x) * 180.0 / Math.PI);
    }

    public get isOk(): boolean {
        return !isNaN(this.latitude) && !isNaN(this.longitude) && this.latitude >= -180 && this.latitude <= 180 && this.longitude >= -90 && this.longitude <= 90;
    }

    public toString(): string {
        const ns = (this.latitude >= 0) ? "N" : "S";
        const ew = (this.longitude >= 0) ? "E" : "W";

        return `${Math.abs(this.latitude).toFixed(5)}° ${ns}, ${Math.abs(this.longitude).toFixed(5)}° ${ew}`;
    }

    public toStringWithElevation(): string {
        return this.toString() + ", " + (this.elevation === undefined ? "" : this.elevation.toFixed(2)) + "m";
    }

    public toGoogleString(): string {
        return `${this.latitude}${this.latitude < 0 ? "S" : "N"},${this.longitude}${this.longitude < 0 ? "W" : "E"}`;
    }

    public equals(coord: Coordinate | undefined): boolean {
        if (this === coord)
            return true;

        const coordinate = coord as Coordinate;
        return this.latitude === coordinate.latitude && this.longitude === coordinate.longitude && this.elevation === coordinate.elevation;
    }

    public static equals(a: Coordinate, b: Coordinate): boolean {
        if (a === b) {
            return true;
        }

        if (!a || !b) {
            return false;
        }

        return a.latitude === b.latitude && a.longitude === b.longitude && a.elevation === b.elevation;
    }
}