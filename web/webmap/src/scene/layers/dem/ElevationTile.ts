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

        const xLeft = Math.max(0, Math.floor(x));
        const xRight = Math.min(this.resolution - 1, Math.ceil(x));
        const yTop = Math.max(0, Math.floor(y));
        const yBottom = Math.min(this.resolution - 1, Math.ceil(y));

        const dx = x - xLeft;
        const dy = y - yTop;

        const top = this.data[xLeft][this.resolution - 1 - yTop] * (1 - dx) + this.data[xRight][this.resolution - 1 - yTop] * dx;
        const bottom = this.data[xLeft][this.resolution - 1 - yBottom] * (1 - dx) + this.data[xRight][this.resolution - 1 - yBottom] * dx;

        return top * (1 - dy) + bottom * dy;
    }

    private static clamp(value: number, min: number, max: number) {
        return Math.min(Math.max(value, min), max);
    }
}