export class Vector2 {
    constructor(public x: number, public y: number) { }

    public get lengthSq() {
        return this.x * this.x + this.y * this.y;
    }

    public get length() {
        return Math.sqrt(this.lengthSq);
    }

    public normalize() {
        const length = this.length;
        if (length < 0.000000001)
            return this;

        return new Vector2(this.x / length, this.y / length);
    }
}