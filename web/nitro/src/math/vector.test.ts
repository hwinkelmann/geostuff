import { Matrix } from './matrix';
import { vec, Vector } from './vector';

describe('Vector', () => {
    const vectorA: Vector = [1, 2, 3];
    const vectorB: Vector = [5, 6, 7];

    describe('clone', () => {
        it('should return a new vector with the same values', () => {
            const clonedVector = vec.clone(vectorA);
            expect(clonedVector).toEqual(vectorA);
            expect(clonedVector).not.toBe(vectorA);
        });
    });

    describe('multiply', () => {
        it('should multiply each component of the vector by the scalar', () => {
            const scalar = 2;
            const multipliedVector = vec.multiply(vectorA, scalar);
            expect(multipliedVector).toEqual([2, 4, 6]);
        });
    });

    describe('add', () => {
        it('should add corresponding components of two vectors', () => {
            const sumVector = vec.add(vectorA, vectorB);
            expect(sumVector).toEqual([6, 8, 10]);
        });
    });

    describe('subtract', () => {
        it('should subtract corresponding components of two vectors', () => {
            const differenceVector = vec.subtract(vectorA, vectorB);
            expect(differenceVector).toEqual([-4, -4, -4]);
        });
    });

    describe('length', () => {
        it('should calculate the length of the vector', () => {
            const vectorLength = vec.length(vectorA);
            expect(vectorLength).toBeCloseTo(3.741657386773941, 4);
        });
    });

    describe('lengthSq', () => {
        it('should calculate the squared length of the vector', () => {
            const vectorLengthSq = vec.lengthSq(vectorA);
            expect(vectorLengthSq).toBe(14);
        });
    });

    describe('dotProduct', () => {
        it('should calculate the dot product of two vectors', () => {
            const dotProduct = vec.dotProduct(vectorA, vectorB);
            expect(dotProduct).toBe(1 * 5 + 2 * 6 + 3 * 7);
        });
    });

    describe('normalize', () => {
        it('should return the normalized vector', () => {
            const normalizedVector = vec.normalize(vectorA);
            expect(normalizedVector).toEqual([
                0.07142857142857142,
                0.14285714285714285,
                0.21428571428571427,
            ]);
        });

        it('should return [0, 0, 0, 0] if the length of the vector is 0', () => {
            const zeroVector: Vector = [0, 0, 0];
            const normalizedVector = vec.normalize(zeroVector);
            expect(normalizedVector).toEqual([0, 0, 0]);
        });
    });

    describe('toString', () => {
        it('should return a string representation of the vector', () => {
            const vectorString = vec.toString(vectorA);
            expect(vectorString).toBe('1, 2, 3');
        });
    });

    describe('createVector', () => {
        it('should create a new vector with the given components', () => {
            const newVector = vec.createVector(1, 2, 3);
            expect(newVector).toEqual([1, 2, 3]);
        });
    });

    describe('getAngleBetween', () => {
        it('should calculate the angle between two vectors in radians', () => {
            const angle = vec.getAngleBetween(vectorA, vectorB);
            expect(angle).toBeCloseTo(0.2523447284, 4);
        });
    });

    describe('matrixMultiply', () => {
        it('should multiply the vector by the matrix', () => {
            const vector: Vector = [1, 2, 3];
            const matrix: Matrix = [
                [2, 0, 0, 0],
                [0, 3, 0, 0],
                [0, 0, 4, 0],
                [0, 0, 0, 1],
            ];
            const result = vec.matrixMultiply(vector, matrix);
        expect(result).toEqual([2, 6, 12, 1]);
        });
    });
});