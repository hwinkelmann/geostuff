import { DoubleVector3 } from "../geometry/DoubleVector3";
import { Coordinate } from "./Coordinate";

export class BoundingBox {
    constructor(
        public minX: number = Number.POSITIVE_INFINITY, 
        public minY: number = Number.POSITIVE_INFINITY, 
        public minZ: number = Number.POSITIVE_INFINITY, 
        public maxX: number = Number.NEGATIVE_INFINITY,
        public maxY: number = Number.NEGATIVE_INFINITY, 
        public maxZ: number = Number.NEGATIVE_INFINITY) {
    }

    public static fromVectors(vectors: DoubleVector3[]): BoundingBox | undefined {
        if (vectors.length === 0)
            return undefined;

        const result = new BoundingBox();
        for (const vector of vectors)
            result.add(vector);

        return result;
    }

    public static fromCoordinates(coords: Coordinate[]): BoundingBox | undefined {
        if (coords.length === 0)
            return undefined;

        const result = new BoundingBox();
        for (const coord of coords)
            result.add(coord);

        return result;
    }

    public static fromBoundingBox(bbox: BoundingBox): BoundingBox {
        return new BoundingBox(bbox.minX, bbox.minY, bbox.minZ, bbox.maxX, bbox.maxY, bbox.maxZ);
    }

    public get centerVector(): DoubleVector3 {
        return new DoubleVector3(
            (this.minX + this.maxX) / 2,
            (this.minY + this.maxY) / 2,
            (this.minZ + this.maxZ) / 2
        );
    }

    public get centerCoordinate(): Coordinate {
        return new Coordinate(
            (this.minX + this.maxX) / 2,
            (this.minY + this.maxY) / 2,
            (this.minZ + this.maxZ) / 2
        );
    }

    public get minCoordinate(): Coordinate {
        return new Coordinate(this.minX, this.minY, this.minZ);
    }

    public get maxCoordinate(): Coordinate {
        return new Coordinate(this.maxX, this.maxY, this.maxZ);
    }

    public get minLatitude(): number {
        return this.minX;
    }

    public set minLatitude(value: number) {
        this.minX = value;
    }

    public get maxLatitude(): number {
        return this.maxX;
    }

    public set maxLatitude(value: number) {
        this.maxX = value;
    }

    public get centerLatitude(): number {
        return (this.minX + this.maxX) / 2;
    }

    public get minLongitude(): number {
        return this.minY;
    }

    public set minLongitude(value: number) {
        this.minY = value;
    }

    public get maxLongitude(): number {
        return this.maxY;
    }

    public set maxLongitude(value: number) {
        this.maxY = value;
    }

    public get centerLongitude(): number {
        return (this.minY + this.maxY) / 2;
    }

    public get minElevation(): number {
        return this.minZ;
    }

    public set minElevation(value: number) {
        this.minZ = value;
    }

    public get maxElevation(): number {
        return this.maxZ;
    }

    public set maxElevation(value: number) {
        this.maxZ = value;
    }

    public get centerElevation(): number {
        return (this.minZ + this.maxZ) / 2;
    }

    public get deltaLatitude(): number {
        return this.maxLatitude - this.minLatitude;
    }

    public get deltaLongitude(): number {
        return this.maxLongitude - this.minLongitude;
    }

    public get deltaElevation(): number {
        return this.maxElevation - this.minElevation;
    }

    public static get entirePlanet(): BoundingBox {
        return BoundingBox.fromCoordinates([new Coordinate(-90, -180, 0), new Coordinate(90, 180, 0)])!;
    }

    public static get germany(): BoundingBox {
        return BoundingBox.fromCoordinates([new Coordinate(54.92, 5.8), new Coordinate(10.21, 15.05)])!;
    }

    public add(arg1: Coordinate | DoubleVector3 | BoundingBox): void {
        if (arg1 instanceof Coordinate) {
            const coord = arg1 as Coordinate;
            this.minX = Math.min(this.minX, coord.latitude);
            this.maxX = Math.max(this.maxX, coord.latitude);
            this.minY = Math.min(this.minY, coord.longitude);
            this.maxY = Math.max(this.maxY, coord.longitude);
            this.minZ = Math.min(this.minZ, coord.elevation ?? 0);
            this.maxZ = Math.max(this.maxZ, coord.elevation ?? 0);
        } else if (arg1 instanceof DoubleVector3) {
            const coord = arg1 as DoubleVector3;
            this.minX = Math.min(this.minX, coord.x);
            this.maxX = Math.max(this.maxX, coord.x);
            this.minY = Math.min(this.minY, coord.y);
            this.maxY = Math.max(this.maxY, coord.y);
            this.minZ = Math.min(this.minZ, coord.z);
            this.maxZ = Math.max(this.maxZ, coord.z);
        } else {
            const bbox = arg1 as BoundingBox;
            this.minX = Math.min(this.minX, bbox.minX);
            this.maxX = Math.max(this.maxX, bbox.maxX);
            this.minY = Math.min(this.minY, bbox.minY);
            this.maxY = Math.max(this.maxY, bbox.maxY);
            this.minZ = Math.min(this.minZ, bbox.minZ);
            this.maxZ = Math.max(this.maxZ, bbox.maxZ);
        }
    }

    public contains(point: Coordinate): boolean {
        const includesPosition = point.latitude >= this.minX &&
            point.latitude <= this.maxX &&
            point.longitude >= this.minY &&
            point.longitude <= this.maxY;

        if (point.elevation !== undefined)
            return includesPosition &&
                point.elevation >= this.minZ &&
                point.elevation <= this.maxZ;

        return includesPosition;
    }

    public intersects(bbox: BoundingBox): boolean {
        const xIntersection = bbox.minX < this.maxX && bbox.maxX > this.minX;
        const yIntersection = bbox.minY < this.maxY && bbox.maxY > this.minY;
        const zIntersection = bbox.minZ < this.maxZ && bbox.maxZ > this.minZ;
        return xIntersection && yIntersection && zIntersection;
    }

    public toString(): string {
        return `X: ${this.minX} - ${this.maxX}, Y: ${this.minY} - ${this.maxY}, Z: ${this.minZ} - ${this.maxZ}`;
    }
}