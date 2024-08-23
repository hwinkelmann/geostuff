import { mat, Matrix } from './matrix';

describe('Matrix', () => {
    const matrixA: Matrix = [
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [9, 10, 11, 12],
        [13, 14, 15, 16],
    ];

    const matrixB: Matrix = [
        [2, 0, 0, 0],
        [0, 2, 0, 0],
        [0, 0, 2, 0],
        [0, 0, 0, 2],
    ];

    const identityMatrix: Matrix = [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
    ];

    describe('clone', () => {
        it('should return a new matrix with the same values', () => {
            const clonedMatrix = mat.clone(matrixA);
            expect(clonedMatrix).toEqual(matrixA);
            expect(clonedMatrix).not.toBe(matrixA);
        });
    });

    describe('multiply', () => {
        it('should correctly multiply two matrices', () => {
            const result = mat.multiply(matrixA, matrixB);
            const expected = [
                [2, 4, 6, 8],
                [10, 12, 14, 16],
                [18, 20, 22, 24],
                [26, 28, 30, 32],
            ];
            expect(result).toEqual(expected);
        });
    });

    describe('toString', () => {
        it('should return a string representation of the matrix', () => {
            const matrixString = mat.toString(matrixA);
            const expected = 'matrix(1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16)';
            expect(matrixString).toEqual(expected);
        });
    });

    describe('createIdentityMatrix', () => {
        it('should return an identity matrix', () => {
            const result = mat.createIdentityMatrix();
            expect(mat.isEqual(result, identityMatrix));
        });
    });

    describe('createTranslationMatrix', () => {
        it('should return a translation matrix', () => {
            const result = mat.createTranslationMatrix(1, 2, 3);
            const expected = [
                [1, 0, 0, 1],
                [0, 1, 0, 2],
                [0, 0, 1, 3],
                [0, 0, 0, 1],
            ];
            expect(result).toEqual(expected);
        });
    });

    describe('createRotationMatrixX', () => {
        it('should return a rotation matrix around the X-axis', () => {
            const result = mat.createRotationMatrixX(Math.PI / 2);
            const expected: Matrix = [
                [1, 0, 0, 0],
                [0, 0, -1, 0],
                [0, 1, 0, 0],
                [0, 0, 0, 1],
            ];
            expect(mat.isEqual(result, expected));
        });
    });

    describe('createRotationMatrixY', () => {
        it('should return a rotation matrix around the Y-axis', () => {
            const result = mat.createRotationMatrixY(Math.PI / 2);
            const expected: Matrix = [
                [0, 0, 1, 0],
                [0, 1, 0, 0],
                [-1, 0, 0, 0],
                [0, 0, 0, 1],
            ];
            expect(mat.isEqual(result, expected));
        });
    });

    describe('createRotationMatrixZ', () => {
        it('should return a rotation matrix around the Z-axis', () => {
            const result = mat.createRotationMatrixZ(Math.PI / 2);
            const expected: Matrix = [
                [0, -1, 0, 0],
                [1, 0, 0, 0],
                [0, 0, 1, 0],
                [0, 0, 0, 1],
            ];
            expect(mat.isEqual(result, expected));
        });
    });

    describe('transpose', () => {
        it('should return the transposed matrix', () => {
            const matrix: Matrix = [
                [1, 2, 3, 4],
                [5, 6, 7, 8],
                [9, 10, 11, 12],
                [13, 14, 15, 16],
            ];
            const result = mat.transpose(matrix);
            const expected: Matrix = [
                [1, 5, 9, 13],
                [2, 6, 10, 14],
                [3, 7, 11, 15],
                [4, 8, 12, 16],
            ];
            expect(result).toEqual(expected);
        });
    });

    describe('invert', () => {
        it('should return the inverted matrix', () => {
            const result = mat.invert(matrixA);
            const expected: Matrix = [
                [-0.0625, 0.125, -0.0625, 0.125],
                [0.125, -0.25, 0.125, -0.25],
                [-0.0625, 0.125, -0.0625, 0.125],
                [0.125, -0.25, 0.125, -0.25],
            ];
            expect(mat.isEqual(result, expected));

        });

        it('should return undefined for a non-invertible matrix', () => {
            const nonInvertibleMatrix: Matrix = [
                [1, 2, 3, 4],
                [5, 6, 7, 8],
                [9, 10, 11, 12],
                [13, 14, 15, 15], // Last row is linearly dependent on the previous rows
            ];
            const result = mat.invert(nonInvertibleMatrix);
            expect(result).toBeUndefined();
        });
    });
});