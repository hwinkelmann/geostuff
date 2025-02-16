import { DoubleMatrix } from "./DoubleMatrix";

export class DoubleVector3 {
    constructor(public x: number = 0, public y: number = 0, public z: number = 0) {
    }

    public clone(): DoubleVector3 {
        return new DoubleVector3(this.x, this.y, this.z);
    }

    public length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    public lengthSq(): number {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }

    public dot(a: DoubleVector3): number {
        return this.x * a.x + this.y * a.y + this.z * a.z;
    }

    public distanceTo(vector: DoubleVector3): number {
        return Math.sqrt(
            (this.x - vector.x) * (this.x - vector.x) +
            (this.y - vector.y) * (this.y - vector.y) +
            (this.z - vector.z) * (this.z - vector.z)
        );
    }

    public distanceToSq(vector: DoubleVector3): number {
        return (this.x - vector.x) * (this.x - vector.x) +
            (this.y - vector.y) * (this.y - vector.y) +
            (this.z - vector.z) * (this.z - vector.z);
    }

    public cross(c: DoubleVector3): DoubleVector3 {
        const x = this.y * c.z - this.z * c.y;
        const y = this.z * c.x - this.x * c.z;
        const z = this.x * c.y - this.y * c.x;

        return new DoubleVector3(x, y, z);
    }

    public isColinear(a: DoubleVector3): boolean {
        const v1 = new DoubleVector3(this.x, this.y, this.z);
        const v2 = new DoubleVector3(a.x, a.y, a.z);

        v1.normalize();
        v2.normalize();

        return (v1.subtract(v2).lengthSq() < 0.001);
    }

    public angle(vector: DoubleVector3): number {
        const numerator = this.dot(vector);
        const denominator = this.length() * vector.length();

        return Math.acos(numerator / denominator);
    }

    public toString(): string {
        return `${this.x.toFixed(5)}, ${this.y.toFixed(5)}, ${this.z.toFixed(5)}`;
    }

    public equals(obj: any): boolean {
        if (!(obj instanceof DoubleVector3)) {
            return false;
        }

        const vector = obj as DoubleVector3;
        return vector.x === this.x && vector.y === this.y && vector.z === this.z;
    }

    public add(a: DoubleVector3): DoubleVector3 {
        this.x += a.x;
        this.y += a.y;
        this.z += a.z;

        return this;
    }

    public multiply(scalar: number): DoubleVector3 {
        this.x *= scalar;
        this.y *= scalar;
        this.z *= scalar;

        return this;
    }

    public normalize(): void {
        const length = this.length();

        if (length === 0) {
            return;
        }

        this.x /= length;
        this.y /= length;
        this.z /= length;
    }

    public subtract(a: DoubleVector3): DoubleVector3 {
        return new DoubleVector3(this.x - a.x, this.y - a.y, this.z - a.z);
    }

    public static add(a: DoubleVector3, b: DoubleVector3): DoubleVector3 {
        return new DoubleVector3(a.x + b.x, a.y + b.y, a.z + b.z);
    }

    public static negate(a: DoubleVector3): DoubleVector3 {
        return new DoubleVector3(-a.x, -a.y, -a.z);
    }

    public static subtract(a: DoubleVector3, b: DoubleVector3): DoubleVector3 {
        return new DoubleVector3(a.x - b.x, a.y - b.y, a.z - b.z);
    }

    public static multiply(a: DoubleVector3, factor: number): DoubleVector3 {
        return new DoubleVector3(a.x * factor, a.y * factor, a.z * factor);
    }

    public transform(transform: DoubleMatrix): DoubleVector3 {
        const tempX =
            this.x * transform.M11 +
            this.y * transform.M21 +
            this.z * transform.M31 +
            transform.M41;
        const tempY =
            this.x * transform.M12 +
            this.y * transform.M22 +
            this.z * transform.M32 +
            transform.M42;
        const tempZ =
            this.x * transform.M13 +
            this.y * transform.M23 +
            this.z * transform.M33 +
            transform.M43;
        const tempW =
            this.x * transform.M14 +
            this.y * transform.M24 +
            this.z * transform.M34 +
            transform.M44;

        this.x = tempX / tempW;
        this.y = tempY / tempW;
        this.z = tempZ / tempW;

        return this;
    }
}

export const origin = new DoubleVector3(0, 0, 0);
