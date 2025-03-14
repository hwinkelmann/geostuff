import { BoundingBox } from "../geography/BoundingBox";
import { Coordinate } from "../geography/Coordinate";
import { MercatorProjection } from "../geography/MercatorProjection";
import { Projection } from "../geography/Projection";

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

    /**
     * Creates a TileDescriptor from a geographic coordinate and zoom level.
     */
    public static fromCoordinate(coord: Coordinate, zoom: number): TileDescriptor {
        const vec = TileDescriptor.projection.project(coord);
        return new TileDescriptor(
            Math.floor(vec.x * (1 << zoom)),
            Math.floor(vec.y * (1 << zoom)),
            zoom
        );
    }

    /**
     * Creates a clone of the current TileDescriptor.
     */
    public clone(): TileDescriptor {
        return new TileDescriptor(this.x, this.y, this.zoom);
    }

    constructor(x?: number, y?: number, zoom?: number) {
        this.x = x ?? 0;
        this.y = y ?? 0;
        this.zoom = zoom ?? 0;
    }

    /**
     * Gets the width of the tile in terms of the number of tiles at the current zoom level.
     */
    public get TilesWidth(): number {
        return 2 ** this.zoom;
    }

    /**
     * Gets the parent tile descriptor, which is one zoom level higher.
     */
    public getParent(): TileDescriptor | undefined {
        if (this.zoom > 0) {
            return new TileDescriptor(Math.floor(this.x / 2), Math.floor(this.y / 2), this.zoom - 1);
        } else 
            return undefined;
    }

    /**
     * Gets the bounding box of the tile in the given projection.
     */
    public getBounds(projection: Projection): BoundingBox {
        return BoundingBox.fromCoordinates([
            projection.fromDescriptorCoordinate(this.x, this.y, this.zoom),
            projection.fromDescriptorCoordinate(this.x + 1, this.y + 1, this.zoom),
        ])!;
    }

    /**
     * Checks if the current tile descriptor is equal to another.
     */
    public equals(obj: any): boolean {
        if (!(obj instanceof TileDescriptor) || !obj) {
            return false;
        }

        const desc: TileDescriptor = obj;
        return desc.x === this.x && desc.y === this.y && desc.zoom === this.zoom;
    }

    /**
     * Returns a list of parent descriptors up to the root. Optionally includes
     * the current descriptor.
     */
    public getAllParents(includeSelf = false): TileDescriptor[] {
        const parents: TileDescriptor[] = includeSelf? [this] : [];
        let parent = this.getParent();
        while (parent) {
            parents.push(parent);
            parent = parent.getParent();
        }
        return parents;
    }

    /**
     * Checks if the current tile descriptor includes another tile descriptor.
     */
    public includes(other: TileDescriptor): boolean {
        if (this.equals(other))
            return true;

        if (this.zoom > other.zoom) 
            return false;

        const diff = other.zoom - this.zoom;
        return other.x >> diff === this.x && other.y >> diff === this.y;
    }

    /**
     * Checks if the current tile descriptor includes or equals another tile descriptor.
     */
    public includesOrEquals(other: TileDescriptor): boolean {
        return this.equals(other) || this.includes(other);
    }

    /**
     * Converts the tile descriptor to a string representation.
     */
    public toString(): string {
        return `${this.x}, ${this.y}, ${this.zoom}`;
    }

    /**
     * Generates a hash code for the tile descriptor.
     */
    public hashCode(): number {
        const prime = 31;
        let result = 1;
        result = prime * result + this.x;
        result = prime * result + this.y;
        result = prime * result + this.zoom;
        return result;
    }

    /**
     * Gets the tile stride, which is the number of tiles at the current zoom level.
     */
    public get tileStride(): number {
        return 1 << this.zoom;
    }

    /**
     * Gets the quad key for the tile descriptor.
     */
    public getQuadKey(): string {
        let quadKey = "";
        for (let i = this.zoom; i > 0; i--) {
            let digit = 0;
            const mask = 1 << (i - 1);
            if ((this.x & mask) !== 0) {
                digit++;
            }
            if ((this.y & mask) !== 0) {
                digit += 2;
            }
            quadKey += digit.toString();
        }
        return quadKey;
    }
}
