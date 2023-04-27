export class Vector3 {
    constructor(public x: number, public y: number, public z: number) { }

    public get lengthSq() {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }

    public get length() {
        return Math.sqrt(this.lengthSq);
    }

    public normalize() {
        const length = this.length;
        if (length < 0.000000001)
            return this;

        return new Vector3(this.x / length, this.y / length, this.z / length);
    }
}