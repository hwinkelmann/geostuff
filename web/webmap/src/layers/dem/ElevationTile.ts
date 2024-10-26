import { TileDescriptor } from "../../models/TileDescriptor";

export class ElevationTile {
    constructor(public desc: TileDescriptor, private data: number[][], public resolution: number) {
    }

    public getElevation(latScale: number, lonScale: number) {

        const x = ElevationTile.clamp(this.resolution * lonScale, 0, this.resolution - 1);
        const y = ElevationTile.clamp(this.resolution * latScale, 0, this.resolution - 1);

        return this.data[x][y];

    }

    private static clamp(value: number, min: number, max: number) {
        return Math.min(Math.max(value, min), max);
    }
}