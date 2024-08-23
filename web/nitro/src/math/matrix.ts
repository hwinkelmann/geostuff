/**
 * First index is row, second index is column.
 */
export type Matrix = [
    [number, number, number, number],
    [number, number, number, number],
    [number, number, number, number],
    [number, number, number, number],
];

export namespace mat {
    export function clone(matrix: Matrix): Matrix {
        const result: number[][] = [];
        for (let i = 0; i < matrix.length; i++) {
            result[i] = [];
            for (let j = 0; j < matrix[i].length; j++)
                result[i][j] = matrix[i][j];
        }

        return result as Matrix;
    }

    /**
     * Matrix multiplication
     */
    export function multiply(a: Matrix, b: Matrix): Matrix {
        const result: number[][] = [];

        for (let i = 0; i < 4; i++) {
            result[i] = [];
            for (let j = 0; j < 4; j++) {
                let sum = 0;
                for (let k = 0; k < 4; k++)
                    sum += a[i][k] * b[k][j];

                result[i][j] = sum;
            }
        }

    return result as Matrix;
    }

    export function toString(matrix: Matrix) {
        const parts: string[] = [];
        for (let row = 0; row < 4; row++)
            for (let col = 0; col < 4; col++)
                parts.push(matrix[row][col].toString());

        return "matrix(" + parts.join(",") + ")";
    }

    export function createIdentityMatrix(): Matrix {
        return [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
    }

    export function createTranslationMatrix(x: number, y: number, z: number): Matrix {
        return [[1, 0, 0, x], [0, 1, 0, y], [0, 0, 1, z], [0, 0, 0, 1]];
    }

    export function createRotationMatrixX(rad: number): Matrix {
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        return [
            [1, 0, 0, 0],
            [0, cos, -sin, 0],
            [0, sin, cos, 0],
            [0, 0, 0, 1]
        ];
    }

    export function createRotationMatrixY(rad: number): Matrix {
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        return [
            [cos, 0, sin, 0],
            [0, 1, 0, 0],
            [-sin, 0, cos, 0],
            [0, 0, 0, 1]
        ];
    }

    export function createRotationMatrixZ(rad: number): Matrix {
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        return [
            [cos, -sin, 0, 0],
            [sin, cos, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ];
    }

    export function invert(matrix: Matrix): Matrix | undefined {
        const m = matrix;
        const det =
            m[0][0] * (m[1][1] * m[2][2] * m[3][3] + m[1][2] * m[2][3] * m[3][1] + m[1][3] * m[2][1] * m[3][2]
                - m[1][3] * m[2][2] * m[3][1] - m[1][1] * m[2][3] * m[3][2] - m[1][2] * m[2][1] * m[3][3])
            - m[0][1] * (m[1][0] * m[2][2] * m[3][3] + m[1][2] * m[2][3] * m[3][0] + m[1][3] * m[2][0] * m[3][2]
                - m[1][3] * m[2][2] * m[3][0] - m[1][0] * m[2][3] * m[3][2] - m[1][2] * m[2][0] * m[3][3])
            + m[0][2] * (m[1][0] * m[2][1] * m[3][3] + m[1][1] * m[2][3] * m[3][0] + m[1][3] * m[2][0] * m[3][1]
                - m[1][3] * m[2][1] * m[3][0] - m[1][0] * m[2][3] * m[3][1] - m[1][1] * m[2][0] * m[3][3])
            - m[0][3] * (m[1][0] * m[2][1] * m[3][2] + m[1][1] * m[2][2] * m[3][0] + m[1][2] * m[2][0] * m[3][1]
                - m[1][2] * m[2][1] * m[3][0] - m[1][0] * m[2][2] * m[3][1] - m[1][1] * m[2][0] * m[3][2]);

        if (det === 0) {
            return undefined; // The matrix is not invertible
        }

        const invDet = 1 / det;

        const adj = [
            [
                m[1][1] * m[2][2] * m[3][3] + m[1][2] * m[2][3] * m[3][1] + m[1][3] * m[2][1] * m[3][2]
                - m[1][3] * m[2][2] * m[3][1] - m[1][1] * m[2][3] * m[3][2] - m[1][2] * m[2][1] * m[3][3],
                m[0][3] * m[2][2] * m[3][1] + m[0][1] * m[2][3] * m[3][2] + m[0][2] * m[2][1] * m[3][3]
                - m[0][1] * m[2][2] * m[3][3] - m[0][2] * m[2][3] * m[3][1] - m[0][3] * m[2][1] * m[3][2],
                m[0][1] * m[1][2] * m[3][3] + m[0][2] * m[1][3] * m[3][1] + m[0][3] * m[1][1] * m[3][2]
                - m[0][3] * m[1][2] * m[3][1] - m[0][1] * m[1][3] * m[3][2] - m[0][2] * m[1][1] * m[3][3],
                m[0][3] * m[1][2] * m[2][1] + m[0][1] * m[1][3] * m[2][2] + m[0][2] * m[1][1] * m[2][3]
                - m[0][1] * m[1][2] * m[2][3] - m[0][2] * m[1][3] * m[2][1] - m[0][3] * m[1][1] * m[2][2]
            ],
            [
                m[1][3] * m[2][2] * m[3][0] + m[1][0] * m[2][3] * m[3][2] + m[1][2] * m[2][0] * m[3][3]
                - m[1][0] * m[2][2] * m[3][3] - m[1][2] * m[2][3] * m[3][0] - m[1][3] * m[2][0] * m[3][2],
                m[0][0] * m[2][2] * m[3][3] + m[0][2] * m[2][3] * m[3][0] + m[0][3] * m[2][0] * m[3][2]
                - m[0][2] * m[2][0] * m[3][3] - m[0][3] * m[2][2] * m[3][0] - m[0][0] * m[2][3] * m[3][2],
                m[0][2] * m[1][0] * m[3][3] + m[0][3] * m[1][2] * m[3][0] + m[0][0] * m[1][3] * m[3][2]
                - m[0][3] * m[1][0] * m[3][2] - m[0][0] * m[1][2] * m[3][3] - m[0][2] * m[1][3] * m[3][0],
                m[0][0] * m[1][2] * m[2][3] + m[0][2] * m[1][3] * m[2][0] + m[0][3] * m[1][0] * m[2][2]
                - m[0][2] * m[1][0] * m[2][3] - m[0][3] * m[1][2] * m[2][0] - m[0][0] * m[1][3] * m[2][2]
            ],
            [
                m[1][0] * m[2][1] * m[3][3] + m[1][1] * m[2][3] * m[3][0] + m[1][3] * m[2][0] * m[3][1]
                - m[1][3] * m[2][1] * m[3][0] - m[1][0] * m[2][3] * m[3][1] - m[1][1] * m[2][0] * m[3][3],
                m[0][1] * m[2][3] * m[3][0] + m[0][0] * m[2][1] * m[3][3] + m[0][3] * m[2][0] * m[3][1]
                - m[0][0] * m[2][3] * m[3][1] - m[0][1] * m[2][0] * m[3][3] - m[0][3] * m[2][1] * m[3][0],
                m[0][0] * m[1][1] * m[3][3] + m[0][1] * m[1][3] * m[3][0] + m[0][3] * m[1][0] * m[3][1]
                - m[0][3] * m[1][1] * m[3][0] - m[0][0] * m[1][3] * m[3][1] - m[0][1] * m[1][0] * m[3][3],
                m[0][1] * m[1][3] * m[2][0] + m[0][0] * m[1][1] * m[2][3] + m[0][3] * m[1][0] * m[2][1]
                - m[0][0] * m[1][3] * m[2][1] - m[0][1] * m[1][0] * m[2][3] - m[0][3] * m[1][1] * m[2][0]
            ],
            [
                m[1][2] * m[2][1] * m[3][0] + m[1][0] * m[2][2] * m[3][1] + m[1][1] * m[2][0] * m[3][2]
                - m[1][1] * m[2][2] * m[3][0] - m[1][2] * m[2][0] * m[3][1] - m[1][0] * m[2][1] * m[3][2],
                m[0][0] * m[2][2] * m[3][1] + m[0][1] * m[2][0] * m[3][2] + m[0][2] * m[2][1] * m[3][0]
                - m[0][2] * m[2][0] * m[3][1] - m[0][0] * m[2][1] * m[3][2] - m[0][1] * m[2][2] * m[3][0],
                m[0][2] * m[1][0] * m[3][1] + m[0][0] * m[1][2] * m[3][1] + m[0][1] * m[1][1] * m[3][0]
                - m[0][1] * m[1][2] * m[3][0] - m[0][0] * m[1][1] * m[3][2] - m[0][2] * m[1][0] * m[3][1],
                m[0][0] * m[1][1] * m[2][2] + m[0][1] * m[1][2] * m[2][0] + m[0][2] * m[1][0] * m[2][1]
                - m[0][2] * m[1][1] * m[2][0] - m[0][0] * m[1][2] * m[2][1] - m[0][1] * m[1][0] * m[2][2]
            ]
        ];

        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                adj[i][j] *= invDet;
            }
        }

        return adj as Matrix;
    }

    export function transpose(matrix: Matrix) {
        const result: number[][] = [];

        for (let i = 0; i < 4; i++) {
            result[i] = [];
            for (let j = 0; j < 4; j++)
                result[i][j] = matrix[j][i];
        }

        return result as Matrix;
    }

    export function isEqual(a: Matrix | undefined, b: Matrix | undefined) {
        if (a === undefined && b === undefined)
            return true;

        if (a === undefined || b === undefined)
            return false;

        for (let i = 0; i < 4; i++)
            for (let j = 0; j < 4; j++)
                if (Math.abs(a[i][j] - b[i][j]) > Number.EPSILON)
                    return false;

        return true;
    }
}