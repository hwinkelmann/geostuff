import { DoubleVector2 } from "./DoubleVector2";
import { DoubleVector3 } from "./DoubleVector3";

/**
 * 4x4-Matrix with double precision
 */
export class DoubleMatrix {
    private data: number[][] = new Array(4).fill(0).map(() => new Array(4).fill(0));

    public set M11(value: number) {
        this.data[0][0] = value;
    }

    public get M11(): number {
        return this.data[0][0];
    }

    public set M12(value: number) {
        this.data[0][1] = value;
    }

    public get M12(): number {
        return this.data[0][1];
    }

    public set M13(value: number) {
        this.data[0][2] = value;
    }

    public get M13(): number {
        return this.data[0][2];
    }

    public set M14(value: number) {
        this.data[0][3] = value;
    }

    public get M14(): number {
        return this.data[0][3];
    }

    public set M21(value: number) {
        this.data[1][0] = value;
    }

    public get M21(): number {
        return this.data[1][0];
    }

    public set M22(value: number) {
        this.data[1][1] = value;
    }

    public get M22(): number {
        return this.data[1][1];
    }

    public set M23(value: number) {
        this.data[1][2] = value;
    }

    public get M23(): number {
        return this.data[1][2];
    }

    public set M24(value: number) {
        this.data[1][3] = value;
    }

    public get M24(): number {
        return this.data[1][3];
    }

    public set M31(value: number) {
        this.data[2][0] = value;
    }

    public get M31(): number {
        return this.data[2][0];
    }

    public set M32(value: number) {
        this.data[2][1] = value;
    }

    public get M32(): number {
        return this.data[2][1];
    }

    public set M33(value: number) {
        this.data[2][2] = value;
    }

    public get M33(): number {
        return this.data[2][2];
    }

    public set M34(value: number) {
        this.data[2][3] = value;
    }

    public get M34(): number {
        return this.data[2][3];
    }

    public set M41(value: number) {
        this.data[3][0] = value;
    }

    public get M41(): number {
        return this.data[3][0];
    }

    public set M42(value: number) {
        this.data[3][1] = value;
    }

    public get M42(): number {
        return this.data[3][1];
    }

    public set M43(value: number) {
        this.data[3][2] = value;
    }

    public get M43(): number {
        return this.data[3][2];
    }

    public set M44(value: number) {
        this.data[3][3] = value;
    }

    public get M44(): number {
        return this.data[3][3];
    }

    public static fromValues(m11: number, m12: number, m13: number, m14: number, m21: number, m22: number, m23: number, m24: number, m31: number, m32: number, m33: number, m34: number, m41: number, m42: number, m43: number, m44: number): DoubleMatrix {
        const result = new DoubleMatrix();
        result.data[0][0] = m11;
        result.data[0][1] = m12;
        result.data[0][2] = m13;
        result.data[0][3] = m14;
        result.data[1][0] = m21;
        result.data[1][1] = m22;
        result.data[1][2] = m23;
        result.data[1][3] = m24;
        result.data[2][0] = m31;
        result.data[2][1] = m32;
        result.data[2][2] = m33;
        result.data[2][3] = m34;
        result.data[3][0] = m41;
        result.data[3][1] = m42;
        result.data[3][2] = m43;
        result.data[3][3] = m44;
        return result;
    }

    public clone() {
        return DoubleMatrix.clone(this);
    }

    public static clone(matrix: DoubleMatrix): DoubleMatrix {
        const result = new DoubleMatrix();
        result.data = matrix.data.map((row) => [...row]);
        return result;
    }

    constructor() {
        this.data = DoubleMatrix.Identity.data.map((row) => [...row]);
    }

    public equals(obj: any): boolean {
        if (!(obj instanceof DoubleMatrix)) {
            return false;
        }

        const matrix = obj as DoubleMatrix;

        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (matrix.data[i][j] !== this.data[i][j]) {
                    return false;
                }
            }
        }

        return true;
    }

    public toString(): string {
        let result = "";
        for (let i = 0; i < 4; i++) {
            result += `${this.data[i][0].toFixed(3)} ${this.data[i][1].toFixed(
                3
            )} ${this.data[i][2].toFixed(3)} ${this.data[i][3].toFixed(3)}, `;
        }

        return result;
    }

    public static multiply(a: DoubleMatrix, b: DoubleMatrix): DoubleMatrix {
        const res = new DoubleMatrix();

        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                res.data[row][col] = 0;
                for (let i = 0; i < 4; i++)
                    res.data[row][col] += a.data[i][col] * b.data[row][i];
            }
        }

        return res;
    }

    public static multiplyMatrixVector(
        matrix: DoubleMatrix,
        vector: DoubleVector3
    ): DoubleVector3 {
        return matrix.multiplyMatrixVector(vector);
    }

    public invert(): void {
        const b = this.clone();
        this.data = DoubleMatrix.Identity.data.map((row) => [...row]);

        for (let i = 0; i < 4; i++) {
            // find pivot
            let mag = 0;
            let pivot = -1;

            for (let j = i; j < 4; j++) {
                const mag2 = Math.abs(b.data[j][i]);
                if (mag2 > mag) {
                    mag = mag2;
                    pivot = j;
                }
            }

            // no pivot (error)
            if (pivot === -1 || mag === 0) {
                return;
            }

            // move pivot row into position
            if (pivot !== i) {
                for (let j = i; j < 4; j++) {
                    const temp = b.data[i][j];
                    b.data[i][j] = b.data[pivot][j];
                    b.data[pivot][j] = temp;
                }

                for (let j = 0; j < 4; j++) {
                    const temp = this.data[i][j];
                    this.data[i][j] = this.data[pivot][j];
                    this.data[pivot][j] = temp;
                }
            }

            // normalize pivot row
            mag = b.data[i][i];

            for (let j = i; j < 4; j++) {
                b.data[i][j] /= mag;
            }

            for (let j = 0; j < 4; j++) {
                this.data[i][j] /= mag;
            }

            // eliminate pivot row component from other rows
            for (let k = 0; k < 4; k++) {
                if (k === i) {
                    continue;
                }

                const mag2 = b.data[k][i];

                for (let j = i; j < 4; j++) {
                    b.data[k][j] = b.data[k][j] - mag2 * b.data[i][j];
                }

                for (let j = 0; j < 4; j++) {
                    this.data[k][j] = this.data[k][j] - mag2 * this.data[i][j];
                }
            }
        }
    }

    public multiplyTransposedVectorMatrix(vec: DoubleVector3): DoubleVector3 {
        const result = new DoubleVector3(
            this.M11 * vec.x + this.M21 * vec.y + this.M31 * vec.z + this.M41,
            this.M12 * vec.x + this.M22 * vec.y + this.M32 * vec.z + this.M42,
            this.M13 * vec.x + this.M23 * vec.y + this.M33 * vec.z + this.M43,
        );

        const w = this.M14 * vec.x + this.M24 * vec.y + this.M34 * vec.z + this.M44;
        result.x /= w;
        result.y /= w;
        result.z /= w;

        return result;
    }

    public multiplyMatrixVector(vec: DoubleVector3): DoubleVector3 {
        const result = new DoubleVector3(
            this.M11 * vec.x + this.M12 * vec.y + this.M13 * vec.z + this.M14,
            this.M21 * vec.x + this.M22 * vec.y + this.M23 * vec.z + this.M24,
            this.M31 * vec.x + this.M32 * vec.y + this.M33 * vec.z + this.M34
        );

        const w = this.M41 * vec.x + this.M42 * vec.y + this.M43 * vec.z + this.M44;
        result.x /= w;
        result.y /= w;
        result.z /= w;

        return result;
    }

    public static get Identity(): DoubleMatrix {
        return DoubleMatrix.fromValues(
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        );
    }

    public static getTranslationMatrix(x: number, y: number, z: number): DoubleMatrix {
        const result = new DoubleMatrix();
        result.M14 = x;
        result.M24 = y;
        result.M34 = z;
        result.M11 = 1;
        result.M22 = 1;
        result.M33 = 1;
        result.M44 = 1;

        return result;
    }

    public static getRotationMatrixX(rad: number): DoubleMatrix {
        const result = new DoubleMatrix();

        result.M11 = 1;
        result.M22 = Math.cos(rad);
        result.M23 = Math.sin(rad);
        result.M32 = -Math.sin(rad);
        result.M33 = Math.cos(rad);
        result.M44 = 1;

        return result;
    }

    public static getRotationMatrixY(rad: number): DoubleMatrix {
        const result = new DoubleMatrix();

        result.M11 = Math.cos(rad);
        result.M13 = -Math.sin(rad);
        result.M22 = 1;
        result.M31 = Math.sin(rad);
        result.M33 = Math.cos(rad);
        result.M44 = 1;

        return result;
    }

    public static getRotationMatrixZ(rad: number): DoubleMatrix {
        const result = new DoubleMatrix();

        result.M11 = Math.cos(rad);
        result.M12 = Math.sin(rad);
        result.M21 = -Math.sin(rad);
        result.M22 = Math.cos(rad);
        result.M33 = 1;
        result.M44 = 1;

        return result;
    }

    public static getScalingMatrix(factorX: number, factorY?: number, factorZ?: number): DoubleMatrix {
        const result = new DoubleMatrix();
        result.M11 = factorX;
        result.M22 = factorY ?? factorX;
        result.M33 = factorZ ?? factorX;
        result.M44 = 1;

        return result;
    }

    public static axisTransform(
        translation: DoubleVector3,
        xAxis: DoubleVector3,
        yAxis: DoubleVector3,
        zAxis: DoubleVector3
    ): DoubleMatrix {
        const xAxisNormalized = xAxis.clone();
        const yAxisNormalized = yAxis.clone();
        const zAxisNormalized = zAxis.clone();

        xAxisNormalized.normalize();
        yAxisNormalized.normalize();
        zAxisNormalized.normalize();

        const translationMatrix = DoubleMatrix.getTranslationMatrix(-translation.x, -translation.y, -translation.z);

        const rotationMatrix = new DoubleMatrix();
        rotationMatrix.M11 = xAxisNormalized.x;
        rotationMatrix.M12 = xAxisNormalized.y;
        rotationMatrix.M13 = xAxisNormalized.z;

        rotationMatrix.M21 = yAxisNormalized.x;
        rotationMatrix.M22 = yAxisNormalized.y;
        rotationMatrix.M23 = yAxisNormalized.z;

        rotationMatrix.M31 = zAxisNormalized.x;
        rotationMatrix.M32 = zAxisNormalized.y;
        rotationMatrix.M33 = zAxisNormalized.z;

        rotationMatrix.M44 = 1;

        return DoubleMatrix.multiply(rotationMatrix, translationMatrix);
    }

    public static mapPoints2D(
        a1: DoubleVector2,
        b1: DoubleVector2,
        a2: DoubleVector2,
        b2: DoubleVector2
    ): DoubleMatrix {
        const a1b1 = b1.subtract(a1);
        const a2b2 = b2.subtract(a2);

        const at = DoubleMatrix.axisTransform(
            a1.toDoubleVector3(),
            a1b1.toDoubleVector3(),
            a1b1.getOrthographic().toDoubleVector3(),
            new DoubleVector3(0, 0, 1)
        );
        const tb = DoubleMatrix.axisTransform(
            a2.toDoubleVector3(),
            a2b2.toDoubleVector3(),
            a2b2.getOrthographic().toDoubleVector3(),
            new DoubleVector3(0, 0, 1)
        );
        tb.invert();

        const scaling = DoubleMatrix.getScalingMatrix(a2.distanceTo(b2) / a1.distanceTo(b1));

        return DoubleMatrix.multiply(
            DoubleMatrix.multiply(tb, scaling),
            at
        );
    }
}