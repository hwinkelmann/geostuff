namespace Nitro.Geometry
{
    public class Vector3
    {
        public double X;
        
        public double Y;
        
        public double Z;

        public Vector3()
        {
            X = Y = Z = 0;
        }

        public Vector3(double x, double y, double z)
        {
            X = x;
            Y = y;
            Z = z;
        }

        public Vector3(Vector3 vec)
        {
            X = vec.X;
            Y = vec.Y;
            Z = vec.Z;
        }

        /// <summary>
        /// Returns the length of this vector
        /// </summary>
        public double Length()
        {
            return Math.Sqrt(X * X + Y * Y + Z * Z);
        }

        /// <summary>
        /// Returns |this| * |this|. Performs better than Length() and is sufficient
        /// for comparisions when e.g. sorting vectors by length.
        /// </summary>
        public double LengthSq()
        {
            return X * X + Y * Y + Z * Z;
        }

        /// <summary>
        /// Performs the dot product
        /// </summary>
        public double Dot(Vector3 a)
        {
            return this.X * a.X + this.Y * a.Y + this.Z * a.Z;
        }

        /// <summary>
        /// Calculates distance from this point to the given one
        /// </summary>
        /// <returns>Distance</returns>
        public double DistanceTo(Vector3 vector)
        {
            return Math.Sqrt((this.X - vector.X) * (this.X - vector.X) +
                (this.Y - vector.Y) * (this.Y - vector.Y) +
                (this.Z - vector.Z) * (this.Z - vector.Z));
        }

        /// <summary>
        /// Performs the cross product of this and c
        /// </summary>
        public Vector3 Cross(Vector3 c)
        {
            double x = this.Y * c.Z - this.Z * c.Y;
            double y = this.Z * c.X - this.X * c.Z;
            double z = this.X * c.Y - this.Y * c.X;

            return new Vector3(x, y, z);
        }

        public bool IsColinear(Vector3 a)
        {
            Vector3 v1 = new Vector3(this);
            Vector3 v2 = new Vector3(a);

            v1.Normalize();
            v2.Normalize();

            return (v1 - v2).LengthSq() < 0.001;
        }

        /// <summary>
        /// Calculates the Angle included between this and the given vector
        /// </summary>
        /// <returns>Angle in radians</returns>
        public double Angle(Vector3 vector)
        {
            double numerator = this.Dot(vector);
            double denominator = this.Length() * vector.Length();

            return Math.Acos(numerator / denominator);
        }

        public override string ToString()
        {
            return String.Format("{0:0.00000}, {1:0.00000}, {2:0.00000}", X, Y, Z);
        }

        public override bool Equals(object? obj)
        {
            if (obj is not Vector3)
                return false;

            var vector = (Vector3)obj;
            return vector.X == X && vector.Y == Y && vector.Z == Z;
        }

        public override int GetHashCode()
        {
            return X.GetHashCode() + Y.GetHashCode() + Z.GetHashCode();
        }

        public static Vector3 operator +(Vector3 a, Vector3 b)
        {
            return new Vector3(a.X + b.X, a.Y + b.Y, a.Z + b.Z);
        }

        public static Vector3 operator -(Vector3 a)
        {
            return new Vector3(-a.X, -a.Y, -a.Z);
        }

        public static Vector3 operator -(Vector3 a, Vector3 b)
        {
            return new Vector3(a.X - b.X, a.Y - b.Y, a.Z - b.Z);
        }

        public static Vector3 operator *(Vector3 a, double factor)
        {
            return new Vector3(a.X * factor, a.Y * factor, a.Z * factor);
        }

        public static Vector3 operator *(double factor, Vector3 a)
        {
            return new Vector3(a.X * factor, a.Y * factor, a.Z * factor);
        }

        public static double operator*(Vector3 a, Vector3 b)
        {
            return a.Dot(b);
        }

        public static Vector3 operator /(Vector3 a, double factor)
        {
            return new Vector3(a.X / factor, a.Y / factor, a.Z / factor);
        }

        public static bool operator ==(Vector3 a, Vector3 b)
        {
            if (System.Object.ReferenceEquals(a, b))
                return true;

            if (((object)a) == null || ((object)b) == null)
                return false;

            return a.X == b.X && a.Y == b.Y && a.Z == b.Z;
        }

        public static bool operator !=(Vector3 a, Vector3 b)
        {
            return !(a == b);
        }

        public static implicit operator Vector2(Vector3 vector)
        {
            return new Vector2(vector.X, vector.Y);
        }

        public static implicit operator Vector3(Vector2 vector)
        {
            return new Vector3(vector.X, vector.Y, 0);
        }

        /// <summary>
        /// Performs in-place matrix multiplication
        /// </summary>
        /// <param name="transform">Matrix to multiply with</param>
        public Vector3 Transform(DoubleMatrix transform)
        {
            double tempX = X * transform.M11 + Y * transform.M21 + Z * transform.M31 + transform.M41;
            double tempY = X * transform.M12 + Y * transform.M22 + Z * transform.M32 + transform.M42;
            double tempZ = X * transform.M13 + Y * transform.M23 + Z * transform.M33 + transform.M43;
            double tempW = X * transform.M14 + Y * transform.M24 + Z * transform.M34 + transform.M44;

            X = tempX / tempW;
            Y = tempY / tempW;
            Z = tempZ / tempW;

            return this;
        }

        /// <summary>
        /// Performs in-place addition
        /// </summary>
        /// <param name="a"></param>
        public Vector3 Add(Vector3 a)
        {
            this.X += a.X;
            this.Y += a.Y;
            this.Z += a.Z;

            return this;
        }

        /// <summary>
        /// Performs in-place scalar multiplication
        /// </summary>
        /// <param name="scalar"></param>
        public Vector3 Multiply(double scalar)
        {
            this.X *= scalar;
            this.Y *= scalar;
            this.Z *= scalar;

            return this;
        }

        /// <summary>
        /// Normalizes this vector. Vector remains unchanged in case length is 0.
        /// </summary>
        public void Normalize()
        {
            double length = Length();

            if (length == 0)
                return;

            X /= length;
            Y /= length;
            Z /= length;
        }
    }
}
