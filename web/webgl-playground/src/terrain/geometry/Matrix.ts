import { Vector3 } from "./Vector3";

export class Matrix {
    private data: number[][];

    constructor(data: number[][]) {
        this.data = data;
    }

    public static clone(matrix: Matrix): Matrix {
        return new Matrix(matrix.data.map(row => row.map(x => x)));
    }

    public static createIdentity(): Matrix {
        return new Matrix([
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ]);
    }

    public static createTranslation(x: number, y: number, z: number): Matrix {
        return new Matrix([
            [1, 0, 0, x],
            [0, 1, 0, y],
            [0, 0, 1, z],
            [0, 0, 0, 1]
        ]);
    }

    public static createScale(x: number, y: number, z: number): Matrix {
        return new Matrix([
            [x, 0, 0, 0],
            [0, y, 0, 0],
            [0, 0, z, 0],
            [0, 0, 0, 1]
        ]);
    }

    public static createRotationX(angle: number): Matrix {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return new Matrix([
            [1, 0, 0, 0],
            [0, c, -s, 0],
            [0, s, c, 0],
            [0, 0, 0, 1]
        ]);
    }

    public static createRotationY(angle: number): Matrix {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return new Matrix([
            [c, 0, s, 0],
            [0, 1, 0, 0],
            [-s, 0, c, 0],
            [0, 0, 0, 1]
        ]);
    }

    public static createRotationZ(angle: number): Matrix {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return new Matrix([
            [c, -s, 0, 0],
            [s, c, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ]);
    }

    /**
     * Creates a perspective projection matrix.
     * @param fov Field of view in radians.
     * @param aspect Aspect ratio.
     * @param near Near clipping plane.
     * @param far Far clipping plane.
     * @returns Perspective projection matrix.
     */
    public static createPerspective(fov: number, aspect: number, near: number, far: number): Matrix {
        const f = 1 / Math.tan(fov / 2);
        const nf = 1 / (near - far);
        return new Matrix([
            [f / aspect, 0, 0, 0],
            [0, f, 0, 0],
            [0, 0, (far + near) * nf, 2 * far * near * nf],
            [0, 0, -1, 0]
        ]);
    }

    /**
     * Inverts the matrix.
     * @returns Inverted matrix or undefined if matrix is not invertible.
     */
    public invert(): Matrix | undefined {
        const b = Matrix.clone(this);
        const data = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];

        for (let i = 0; i < 4; i++) {
            // find pivot
            let mag = 0;
            let pivot = -1;

            for (let j = i; j < 4; j++) {
                let mag2 = Math.abs(b.data[j][i]);
                if (mag2 > mag) {
                    mag = mag2;
                    pivot = j;
                }
            }

            // no pivot (error)
            if (pivot === -1 || mag === 0)
                return;

            // move pivot row into position
            if (pivot !== i) {
                let temp: number;
                for (let j = i; j < 4; j++) {
                    temp = b.data[i][j];
                    b.data[i][j] = b.data[pivot][j];
                    b.data[pivot][j] = temp;
                }

                for (let j = 0; j < 4; j++) {
                    temp = data[i][j];
                    data[i][j] = data[pivot][j];
                    data[pivot][j] = temp;
                }
            }

            // normalize pivot row
            mag = b.data[i][i];

            for (let j = i; j < 4; j++)
                b.data[i][j] /= mag;

            for (let j = 0; j < 4; j++)
                data[i][j] /= mag;

            // eliminate pivot row component from other rows
            for (let k = 0; k < 4; k++) {
                if (k === i)
                    continue;

                let mag2 = b.data[k][i];

                for (let j = i; j < 4; j++)
                    b.data[k][j] = b.data[k][j] - mag2 * b.data[i][j];

                for (let j = 0; j < 4; j++)
                    data[k][j] = data[k][j] - mag2 * data[i][j];
            }
        }

        return new Matrix(data);
    }

    /**
     * Multiplies this matrix with another matrix.
     * @param other matrix to multiply with
     * @returns multiplied matrix
     */
    public multiply(other: Matrix): Matrix {
        const result: number[][] = [[], [], [], []];

        for (let row = 0; row < 4; row++)
            for (let col = 0; col < 4; col++) {
                result[row][col] = 0;
                for (let i = 0; i < 4; i++)
                    result[row][col] += (this.data[i][col] * other.data[row][i]);
            }

        return new Matrix(result);
    }

    /**
     * Creates a matrix that transforms the local coordinate system to one
     * that is centered at translation, with the x-, y- and z-axis pointing
     * in the direction of the given vectors.
     * @param translation origin of the target coordinate system
     * @param x x-axis
     * @param y y-axis
     * @param z z-axis
     * @returns transformation matrix
     */
    public static createTransform(translation: Vector3, x: Vector3, y: Vector3, z: Vector3) {
        const nx = x.normalize();
        const ny = y.normalize();
        const nz = z.normalize();

        const translationMatrix = Matrix.createTranslation(-translation.x, -translation.y, -translation.z);

        const rotationMatrix = new Matrix([
            [nx.x, nx.y, nx.z, 0],
            [ny.x, ny.y, ny.z, 0],
            [nz.x, nz.y, nz.z, 0],
            [0, 0, 0, 1]
        ]);

        return rotationMatrix.multiply(translationMatrix);
    }
}