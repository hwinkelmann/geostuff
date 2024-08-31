import { BoundingBox } from "../geography/BoundingBox";
import { Coordinate } from "../geography/Coordinate";
import { MercatorProjection } from "../geography/MercatorProjection";

/**
 * Tile addressing descriptor
 */
export class TileDescriptor {
    private static projection: MercatorProjection = new MercatorProjection();

    /**
     * X-coordinate of the tile
     */
    public x: number;

    /**
     * Y-coordinate of the tile
     */
    public y: number;

    /**
     * zoom level of this tile (0 = whole earth fits in a single tile)
     */
    public zoom: number;

    public static fromValues(x: number, y: number, zoom: number): TileDescriptor {
        return new TileDescriptor(x, y, zoom);
    }

    public static fromCoordinate(coord: Coordinate, zoom: number): TileDescriptor {
        const vec = TileDescriptor.projection.project(coord);
        return new TileDescriptor(
            Math.floor(vec.x * (1 << zoom)),
            Math.floor(vec.y * (1 << zoom)),
            zoom
        );
    }

    public clone(): TileDescriptor {
        return new TileDescriptor(this.x, this.y, this.zoom);
    }

    constructor(x?: number, y?: number, zoom?: number) {
        this.x = x ?? 0;
        this.y = y ?? 0;
        this.zoom = zoom ?? 0;
    }

    public get TilesWidth(): number {
        return 2 ** this.zoom;
    }

    public GetParent(): TileDescriptor {
        if (this.zoom > 0) {
            return new TileDescriptor(Math.floor(this.x / 2), Math.floor(this.y / 2), this.zoom - 1);
        } else {
            return this.clone();
        }
    }

    public GetBounds(): BoundingBox {
        return BoundingBox.fromCoordinates([
            TileDescriptor.projection.fromDescriptorCoordinate(this.x, this.y, this.zoom),
            TileDescriptor.projection.fromDescriptorCoordinate(this.x + 1, this.y + 1, this.zoom),
        ])!;
    }

    public equals(obj: any): boolean {
        if (!(obj instanceof TileDescriptor) || !obj) {
            return false;
        }

        const desc: TileDescriptor = obj;
        return desc.x === this.x && desc.y === this.y && desc.zoom === this.zoom;
    }

    public toString(): string {
        return `${this.x}, ${this.y}, ${this.zoom}`;
    }

    public hashCode(): number {
        return (this.x + this.y * 1000) * this.zoom;
    }
}
