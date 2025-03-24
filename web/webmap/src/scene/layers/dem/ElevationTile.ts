import { BoundingBox } from "../../../geography/BoundingBox";
import { Coordinate } from "../../../geography/Coordinate";
import { TileDescriptor } from "../../../models/TileDescriptor";

export class ElevationTile {
    public readonly minElevation: number;
    public readonly maxElevation: number;

    constructor(public desc: TileDescriptor, private data: number[][], public resolution: number, public boundingBox: BoundingBox) {
        this.minElevation = Math.min(...data.map(row => Math.min(...row)));
        this.maxElevation = Math.max(...data.map(row => Math.max(...row)));
    }

    public getElevation(coord: Coordinate) {
        const latScale = (coord.latitude - this.boundingBox.minLatitude) / this.boundingBox.deltaLatitude;
        const lonScale = (coord.longitude - this.boundingBox.minLongitude) / this.boundingBox.deltaLongitude;

        // console.assert(latScale < 0 || latScale > 1 || lonScale < 0 || lonScale > 1, "Coordinate out of bounds");

        const x = ElevationTile.clamp(this.resolution * lonScale, 0, this.resolution - 1);
        const y = ElevationTile.clamp(this.resolution * latScale, 0, this.resolution - 1);

        return this.data[Math.floor(x)][this.resolution - Math.floor(y) - 1];
    }

    private static clamp(value: number, min: number, max: number) {
        return Math.min(Math.max(value, min), max);
    }
}