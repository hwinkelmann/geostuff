namespace Nitro.Geometry
{
    /// <summary>
    /// 4x4-Matrix with double precision
    /// </summary>
    public class DoubleMatrix
    {
        #region Attribute
        private double[,] data = new double[4,4];

        public double M11
        {
            set { data[0, 0] = value; }
            get { return data[0, 0]; }
        }

        public double M12
        {
            set { data[0, 1] = value; }
            get { return data[0, 1]; }
        }

        public double M13
        {
            set { data[0, 2] = value; }
            get { return data[0, 2]; }
        }

        public double M14
        {
            set { data[0, 3] = value; }
            get { return data[0, 3]; }
        }

        public double M21
        {
            set { data[1, 0] = value; }
            get { return data[1, 0]; }
        }

        public double M22
        {
            set { data[1, 1] = value; }
            get { return data[1, 1]; }
        }

        public double M23
        {
            set { data[1, 2] = value; }
            get { return data[1, 2]; }
        }

        public double M24
        {
            set { data[1, 3] = value; }
            get { return data[1, 3]; }
        }

        public double M31
        {
            set { data[2, 0] = value; }
            get { return data[2, 0]; }
        }

        public double M32
        {
            set { data[2, 1] = value; }
            get { return data[2, 1]; }
        }

        public double M33
        {
            set { data[2, 2] = value; }
            get { return data[2, 2]; }
        }

        public double M34
        {
            set { data[2, 3] = value; }
            get { return data[2, 3]; }
        }

        public double M41
        {
            set { data[3, 0] = value; }
            get { return data[3, 0]; }
        }

        public double M42
        {
            set { data[3, 1] = value; }
            get { return data[3, 1]; }
        }

        public double M43
        {
            set { data[3, 2] = value; }
            get { return data[3, 2]; }
        }

        public double M44
        {
            set { data[3, 3] = value; }
            get { return data[3, 3]; }
        }
        #endregion Attribute

        #region Constructors
        public DoubleMatrix()
        {
        }

        /// <summary>
        /// Copy-Construktor
        /// </summary>
        /// <param name="m">Matrix that should be copied</param>
        public DoubleMatrix(DoubleMatrix m)
        {
            data = new double[4, 4];
            for (int i = 0; i < 4; i++)
                for (int j = 0; j < 4; j++)
                    data[i, j] = m.data[i, j];
        }

        public DoubleMatrix(double m11, double m12, double m13, double m14,
            double m21, double m22, double m23, double m24,
            double m31, double m32, double m33, double m34,
            double m41, double m42, double m43, double m44)
            : base()
        {
            M11 = m11;
            M12 = m12;
            M13 = m13;
            M14 = m14;
            M21 = m21;
            M22 = m22;
            M23 = m23;
            M24 = m24;
            M31 = m31;
            M32 = m32;
            M33 = m33;
            M34 = m34;
            M41 = m41;
            M42 = m42;
            M43 = m43;
            M44 = m44;
        }
        #endregion

        #region Overloads
        public override bool Equals(object? obj)
        {
            if (obj is not DoubleMatrix)
                return false;
                
            DoubleMatrix matrix = (DoubleMatrix)obj;

            for (int i = 0; i < 4; i++)
                for (int j = 0; j < 4; j++)
                    if (matrix.data[i, j] != this.data[i, j])
                        return false;
            
            return true;
        }

        public override int GetHashCode()
        {
            return M11.GetHashCode() + M22.GetHashCode() + M33.GetHashCode() +
                M41.GetHashCode() + M42.GetHashCode() + M43.GetHashCode();
        }

        public override string ToString()
        {
            String result = "";
            for (int i = 0; i < 4; i++)
                result += String.Format("{0:0.000} {1:0.000} {2:0.000} {3:0.000}, ", data[i, 0], data[i, 1], data[i, 2], data[i, 3]);

            return result;
        }
        #endregion

        #region Operations
        /// <summary>
        /// Matrix multiplication. If m1 and m2 are transform matrices, then matrix a will be applied before b is.
        /// </summary>
        /// <param name="a">Transformation that is applied first</param>
        /// <param name="b">Transformation that is applied second</param>
        public static DoubleMatrix operator *(DoubleMatrix a, DoubleMatrix b)
        {
            DoubleMatrix res = new DoubleMatrix();

            for (int row = 0; row < 4; row++)
            {
                for (int col = 0; col < 4; col++)
                {
                    res.data[row, col] = 0;
                    for (int i = 0; i < 4; i++)
                        res.data[row, col] += (a.data[i, col] * b.data[row, i]);
                }
            }

            return res;
        }

        public static DoubleVector3 operator *(DoubleMatrix matrix, DoubleVector3 vector)
        {
            return matrix.MultiplyMatrixVector(vector);
        }

        public static DoubleVector2 operator *(DoubleMatrix matrix, DoubleVector2 vector)
        {
            return matrix.MultiplyMatrixVector(vector);
        }

        public void Invert()
        {
            DoubleMatrix b = new DoubleMatrix(this);
            data = (double[,])DoubleMatrix.Identity.data.Clone();

            for (int i = 0; i < 4; i++)
            {
                // find pivot
                double mag = 0;
                int pivot = -1;

                for (int j = i; j < 4; j++)
                {
                    double mag2 = Math.Abs(b.data[j, i]);
                    if (mag2 > mag)
                    {
                        mag = mag2;
                        pivot = j;
                    }
                }

                // no pivot (error)
                if (pivot == -1 || mag == 0)
                    return;

                // move pivot row into position
                if (pivot != i)
                {
                    double temp;
                    for (int j = i; j < 4; j++)
                    {
                        temp = b.data[i, j];
                        b.data[i, j] = b.data[pivot, j];
                        b.data[pivot, j] = temp;
                    }

                    for (int j = 0; j < 4; j++)
                    {
                        temp = data[i, j];
                        data[i, j] = data[pivot, j];
                        data[pivot, j] = temp;
                    }
                }

                // normalize pivot row
                mag = b.data[i, i];

                for (int j = i; j < 4; j++) 
                    b.data[i, j] /= mag;
                
                for (int j = 0; j < 4; j++) 
                    data[i, j] /= mag;

                // eliminate pivot row component from other rows
                for (int k = 0; k < 4; k++)
                {
                    if (k == i) 
                        continue;
                    
                    var mag2 = b.data[k, i];

                    for (int j = i; j < 4; j++) 
                        b.data[k, j] = b.data[k, j] - mag2 * b.data[i, j];
                    
                    for (int j = 0; j < 4; j++) 
                        data[k, j] = data[k, j] - mag2 * data[i, j];
                }
            }
        }

        public DoubleVector3 MultiplyTransposedVectorMatrix(DoubleVector3 vec)
        {
            DoubleVector3 result = new DoubleVector3();

            result.X = M11 * vec.X + M21 * vec.Y + M31 * vec.Z + M41;
            result.Y = M12 * vec.X + M22 * vec.Y + M32 * vec.Z + M42;
            result.Z = M13 * vec.X + M23 * vec.Y + M33 * vec.Z + M43;
            
            //double w = M14 * vec.X + M24 * vec.Y + M34 * vec.Z + M44;
            //result.X /= w;
            //result.Y /= w;
            //result.Z /= w;

            return result;
        }

        public DoubleVector2 MultiplyTransposedVectorMatrix(DoubleVector2 vec)
        {
            DoubleVector2 result = new DoubleVector2();

            result.X = M11 * vec.X + M21 * vec.Y + M41;
            result.Y = M12 * vec.X + M22 * vec.Y + M42;

            //double w = M14 * vec.X + M24 * vec.Y + M34 * vec.Z + M44;
            //result.X /= w;
            //result.Y /= w;

            return result;
        }

        public DoubleVector3 MultiplyMatrixVector(DoubleVector3 vec)
        {
            DoubleVector3 result = new DoubleVector3();

            result.X = M11 * vec.X + M12 * vec.Y + M13 * vec.Z + M14;
            result.Y = M21 * vec.X + M22 * vec.Y + M23 * vec.Z + M24;
            result.Z = M31 * vec.X + M32 * vec.Y + M33 * vec.Z + M34;
            
            double w = M41 * vec.X + M42 * vec.Y + + M43 * vec.Z + M44;
            result.X /= w;
            result.Y /= w;
            result.Z /= w;

            return result;
        }

        public DoubleVector2 MultiplyMatrixVector(DoubleVector2 vec)
        {
            DoubleVector2 result = new DoubleVector2();

            result.X = M11 * vec.X + M12 * vec.Y + M14;
            result.Y = M21 * vec.X + M22 * vec.Y + M24;

            double w = M41 * vec.X + M42 * vec.Y + M44;
            result.X /= w;
            result.Y /= w;

            return result;
        }

        #endregion

        #region Preset Matrices
        /// <summary>
        /// Identitätsmatrix
        /// </summary>
        public static DoubleMatrix Identity
        {
            get
            {
                return new DoubleMatrix(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
            }
        }

        /// <summary>
        /// Berechnet eine Translationsmatrix für eine Verschiebung um den angegebenen Vektor
        /// </summary>
        public static DoubleMatrix Translation(double x, double y, double z)
        {
            DoubleMatrix result = new DoubleMatrix();
            result.M14 = x;
            result.M24 = y;
            result.M34 = z;
            result.M11 = 1;
            result.M22 = 1;
            result.M33 = 1;
            result.M44 = 1;

            return result;
        }

        /// <summary>
        /// Berechnet eine Translationsmatrix für eine Verschiebung um den angegebenen Vektor
        /// </summary>
        /// <param name="translation"></param>
        /// <returns></returns>
        public static DoubleMatrix Translation(DoubleVector3 translation)
        {
            DoubleMatrix result = new DoubleMatrix();
            result.M14 = translation.X;
            result.M24 = translation.Y;
            result.M34 = translation.Z;
            result.M11 = 1;
            result.M22 = 1;
            result.M33 = 1;
            result.M44 = 1;

            return result;
        }

        /// <summary>
        /// Drehmatrix um die X-Achse. In einem rechtshändigen Koordinatensystem wird im
        /// Uhrzeigersinn gedreht, in einem linkshändigen entgegen dem Uhrzeigersinn.
        /// </summary>
        /// <param name="rad"></param>
        /// <returns></returns>
        public static DoubleMatrix RotationX(double rad)
        {
            DoubleMatrix result = new DoubleMatrix();

            result.M11 = 1;
            result.M22 = Math.Cos(rad);
            result.M23 = Math.Sin(rad);
            result.M32 = -Math.Sin(rad);
            result.M33 = Math.Cos(rad);
            result.M44 = 1;

            return result;
        }

        /// <summary>
        /// Drehmatrix um die Y-Achse. In einem rechtshändigen Koordinatensystem wird im
        /// Uhrzeigersinn gedreht, in einem linkshändigen entgegen dem Uhrzeigersinn.
        /// </summary>
        /// <param name="rad"></param>
        /// <returns></returns>
        public static DoubleMatrix RotationY(double rad)
        {
            DoubleMatrix result = new DoubleMatrix();

            result.M11 = Math.Cos(rad);
            result.M13 = -Math.Sin(rad);
            result.M22 = 1;
            result.M31 = Math.Sin(rad);
            result.M33 = Math.Cos(rad);
            result.M44 = 1;

            return result;
        }

        /// <summary>
        /// Drehmatrix um die Z-Achse. In einem rechtshändigen Koordinatensystem wird im
        /// Uhrzeigersinn gedreht, in einem linkshändigen entgegen dem Uhrzeigersinn.
        /// </summary>
        /// <param name="rad"></param>
        /// <returns></returns>
        public static DoubleMatrix RotationZ(double rad)
        {
            DoubleMatrix result = new DoubleMatrix();

            result.M11 = Math.Cos(rad);
            result.M12 = Math.Sin(rad);
            result.M21 = -Math.Sin(rad);
            result.M22 = Math.Cos(rad);
            result.M33 = 1;
            result.M44 = 1;

            return result;
        }

        /// <summary>
        /// Skalierungsmatrix. Alle Achsen werden um den angegebenen Faktor skaliert.
        /// </summary>
        /// <param name="factor"></param>
        /// <returns></returns>
        public static DoubleMatrix Scaling(double factor)
        {
            return Scaling(factor, factor, factor);
        }

        /// <summary>
        /// Skalierungsmatrix. Die Achsen werden um die jeweiligen Faktoren skaliert.
        /// </summary>
        /// <param name="factorX"></param>
        /// <param name="factorY"></param>
        /// <param name="factorZ"></param>
        /// <returns></returns>
        public static DoubleMatrix Scaling(double factorX, double factorY, double factorZ)
        {
            DoubleMatrix result = new DoubleMatrix();
            result.M11 = factorX;
            result.M22 = factorY;
            result.M33 = factorZ;
            result.M44 = 1;

            return result;
        }

        /// <summary>
        /// Berechnet eine Transformationsmatrix, die Korrdinaten aus dem aktuellen
        /// Koordinatensystem in ein neues überführt. Dies wird durch die Achsen und den
        /// Nullpunkt beschrieben.
        /// </summary>
        /// <param name="translation">Nullpunkt des berechneten Koordinatensystems</param>
        /// <param name="xAxis">Richtung der x-Achse</param>
        /// <param name="yAxis">Richtung der y-Achse</param>
        /// <param name="zAxis">Richtung der z-Achse</param>
        /// <returns>Transformationsmatrix</returns>
        public static DoubleMatrix AxisTransform(DoubleVector3 translation, DoubleVector3 xAxis, DoubleVector3 yAxis, DoubleVector3 zAxis)
        {
            DoubleVector3 xAxisNormalized = new DoubleVector3(xAxis);
            DoubleVector3 yAxisNormalized = new DoubleVector3(yAxis);
            DoubleVector3 zAxisNormalized = new DoubleVector3(zAxis);

            xAxisNormalized.Normalize();
            yAxisNormalized.Normalize();
            zAxisNormalized.Normalize();

            DoubleMatrix translationMatrix = DoubleMatrix.Translation(-translation);

            DoubleMatrix rotationMatrix = new DoubleMatrix();
            rotationMatrix.M11 = xAxisNormalized.X;
            rotationMatrix.M12 = xAxisNormalized.Y;
            rotationMatrix.M13 = xAxisNormalized.Z;

            rotationMatrix.M21 = yAxisNormalized.X;
            rotationMatrix.M22 = yAxisNormalized.Y;
            rotationMatrix.M23 = yAxisNormalized.Z;

            rotationMatrix.M31 = zAxisNormalized.X;
            rotationMatrix.M32 = zAxisNormalized.Y;
            rotationMatrix.M33 = zAxisNormalized.Z;

            rotationMatrix.M44 = 1;

            return rotationMatrix * translationMatrix;

        }

        /// <summary>
        /// Bestimmt eine 2D-Abbildung M, die die Punkte a1 und b1 auf a2 und b2 abbildet.
        /// Es gilt: M * a1 = a2 und M * b1 = b2
        /// </summary>
        /// <param name="a1">Punkt 1 des ersten Punktpaars</param>
        /// <param name="b1">Punkt 2 des ersten Punktpaars</param>
        /// <param name="a2">Punkt 1 des zweiten Punktpaars</param>
        /// <param name="b2">Punkt 2 des zweiten Punktpaars</param>
        /// <returns>Ergebnis M. Es gilt M * a1 = a2 und M * b1 = b2</returns>
        public static DoubleMatrix MapPoints2D(DoubleVector2 a1, DoubleVector2 b1, DoubleVector2 a2, DoubleVector2 b2)
        {
            DoubleVector2 a1b1 = b1 - a1;
            DoubleVector2 a2b2 = b2 - a2;

            DoubleMatrix at = DoubleMatrix.AxisTransform(a1, a1b1, a1b1.Orthographic, new DoubleVector3(0, 0, 1));
            DoubleMatrix tb = DoubleMatrix.AxisTransform(a2, a2b2, a2b2.Orthographic, new DoubleVector3(0, 0, 1));
            tb.Invert();

            DoubleMatrix scaling = DoubleMatrix.Scaling(a2.DistanceTo(b2) / a1.DistanceTo(b1));

            return tb * scaling * at;
        }

        #endregion
    }
}
