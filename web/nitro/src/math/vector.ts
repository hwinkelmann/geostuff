import { Matrix } from "./matrix";

export type Vector = [number, number, number, number?];

export namespace vec {
    export function clone(vector: Vector): Vector {
        return [vector[0], vector[1], vector[2]];
    }

    export function multiply(vector: Vector, scalar: number): Vector {
        return [vector[0] * scalar, vector[1] * scalar, vector[2] * scalar];
    }

    export function add(vector: Vector, other: Vector): Vector {
        return [vector[0] + other[0], vector[1] + other[1], vector[2] + other[2]];
    }

    export function subtract(vector: Vector, other: Vector): Vector {
        return [vector[0] - other[0], vector[1] - other[1], vector[2] - other[2]];
    }

    /**
     * Calculates the length of a vector. If you just want to compare vector lengths,
     * use lengthSq instead
     */
    export function length(vector: Vector) {
        return Math.sqrt(lengthSq(vector));
    }

    /**
     * Calculates the squared length of a vector. Faster than length().
     */
    export function lengthSq(vector: Vector) {
        return vector[0] * vector[0] + vector[1] * vector[1] + vector[2] * vector[2];
    }

    /**
     * Calculates the dot product of two vectors
     */
    export function dotProduct(a: Vector, b: Vector) {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    }

    /**
     * Calculates the cross product of two vectors
     */
    export function crossProduct(a: Vector, b: Vector) {
        return [
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0],
        ];
    }

    /**
     * Returns a the normalized vector
     * @returns Normalized vector or (0, 0, 0) if length was 0
     */
    export function normalize(vector: Vector): Vector {
        const len = lengthSq(vector);
        if (len === 0)
            return [0, 0, 0];

        return multiply(vector, 1 / len);
    }

    export function toString(vector: Vector) {
        return `${vector[0]}, ${vector[1]}, ${vector[2]}`;
    }


    export function createVector(x: number, y: number, z: number): Vector {
        return [x, y, z];
    }

    /**
     * Returns the angle between two vectors in radians
     * @returns Angle in radians or NaN if one of the vectors has a length of 0
     */
    export function getAngleBetween(a: Vector, b: Vector) {
        const dot = dotProduct(a, b);
        const mag = length(a) * length(b);

        if (mag === 0)
            return Number.NaN;

        return Math.acos(dot / mag);
    }

    export function matrixMultiply(v: Vector, m: Matrix): Vector {
        const v3 = v[3] ?? 1;
        return [
            m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2] + m[0][3] * v3,
            m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2] + m[1][3] * v3,
            m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2] + m[2][3] * v3,
            m[3][0] * v[0] + m[3][1] * v[1] + m[3][2] * v[2] + m[3][3] * v3,
        ];
    }
}
