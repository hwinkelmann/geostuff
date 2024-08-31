import { DoubleVector3 } from "./DoubleVector3";

export class DoubleVector2 {
    constructor(public x: number = 0, public y: number = 0) {
    }

    public length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    public lengthSq(): number {
        return this.x * this.x + this.y * this.y;
    }

    public dot(vec: DoubleVector2): number {
        return this.x * vec.x + this.y * vec.y;
    }

    public getOrthographic(): DoubleVector2 {
        return new DoubleVector2(-this.y, this.x);
    }

    public isColinear(a: DoubleVector2): boolean {
        const v1 = new DoubleVector2(this.x, this.y);
        const v2 = new DoubleVector2(a.x, a.y);

        v1.normalize();
        v2.normalize();

        return v1.subtract(v2).lengthSq() < 0.001;
    }

    public angleBetween(vector: DoubleVector2): number {
        const numerator = this.dot(vector);
        const denominator = this.length() * vector.length();

        return Math.acos(numerator / denominator);
    }

    public distanceTo(vector: DoubleVector2): number {
        return Math.sqrt(
            (this.x - vector.x) * (this.x - vector.x) +
                (this.y - vector.y) * (this.y - vector.y)
        );
    }

    public toString(): string {
        return `${this.x.toFixed(5)}, ${this.y.toFixed(5)}`;
    }

    public equals(obj?: DoubleVector2): boolean {
        if (!obj) 
            return false;

        const vector = obj as DoubleVector2;
        return vector.x === this.x && vector.y === this.y;
    }

    public static add(a: DoubleVector2, b: DoubleVector2): DoubleVector2 {
        return new DoubleVector2(a.x + b.x, a.y + b.y);
    }

    public static subtract(a: DoubleVector2, b: DoubleVector2): DoubleVector2 {
        return new DoubleVector2(a.x - b.x, a.y - b.y);
    }

    public static multiply(a: DoubleVector2, factor: number): DoubleVector2 {
        return new DoubleVector2(a.x * factor, a.y * factor);
    }

    public static divide(a: DoubleVector2, factor: number): DoubleVector2 {
        return new DoubleVector2(a.x / factor, a.y / factor);
    }

    public static equals(a?: DoubleVector2, b?: DoubleVector2): boolean {
        return a?.x === b?.x && a?.y === b?.y;
    }

    public add(a: DoubleVector2): DoubleVector2 {
        this.x += a.x;
        this.y += a.y;

        return this;
    }

    public multiply(scalar: number): DoubleVector2 {
        this.x *= scalar;
        this.y *= scalar;

        return this;
    }

    public normalize(): DoubleVector2 {
        const length = this.length();

        if (length === 0) return this;

        this.x /= length;
        this.y /= length;

        return this;
    }

    public subtract(a: DoubleVector2): DoubleVector2 {
        return new DoubleVector2(this.x - a.x, this.y - a.y);
    }

    public toDoubleVector3(): DoubleVector3 {
        return new DoubleVector3(this.x, this.y, 0);
    }
}
