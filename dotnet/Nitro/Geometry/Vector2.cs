namespace Nitro.Geometry
{
    public class Vector2
    {
        public double X;

        public double Y;

        public Vector2()
        {
            X = Y = 0;
        }

        public Vector2(double x, double y)
        {
            X = x;
            Y = y;
        }

        public Vector2(Vector2 vector)
        {
            X = vector.X;
            Y = vector.Y;
        }

        /// <summary>
        /// Returns the length of this vector
        /// </summary>
        public double Length()
        {
            return Math.Sqrt(X * X + Y * Y);
        }

        /// <summary>
        /// Returns |this| * |this|. Performs better than Length() and is sufficient
        /// for comparisions when e.g. sorting vectors by length.
        /// </summary>
        public double LengthSq()
        {
            return X * X + Y * Y;
        }

        /// <summary>
        /// Performs the dot product
        /// </summary>
        public double Dot(Vector2 a)
        {
            return this.X * a.X + this.Y * a.Y;
        }

        /// <summary>
        /// Orthographic Vector
        /// </summary>
        public Vector2 Orthographic
        {
            get
            {
                return new Vector2(-this.Y, this.X);
            }
        }

        /// <summary>
        /// Checks if two vectors are colinear ("parallel")
        /// </summary>
        /// <returns>true, if this and vector a are colinear.</returns>
        public bool IsColinear(Vector2 a)
        {
            Vector2 v1 = new Vector2(this);
            Vector2 v2 = new Vector2(a);

            v1.Normalize();
            v2.Normalize();

            return (v1 - v2).LengthSq() < 0.001;
        }

        /// <summary>
        /// Calculates the Angle included between this and the given vector
        /// </summary>
        /// <returns>Angle in radians</returns>
        public double Angle(Vector2 vector)
        {
            double numerator = this.Dot(vector);
            double denominator = this.Length() * vector.Length();

            return Math.Acos(numerator / denominator);
        }

        /// <summary>
        /// Calculates distance from this point to the given one
        /// </summary>
        /// <returns>Distance</returns>
        public double DistanceTo(Vector3 vector)
        {
            return Math.Sqrt((this.X - vector.X) * (this.X - vector.X) +
                (this.Y - vector.Y) * (this.Y - vector.Y));
        }

        public override string ToString()
        {
            return String.Format("{0:0.00000}, {1:0.00000}", X, Y);
        }

        public override bool Equals(object? obj)
        {
            if (obj is not Vector2)
                return false;

            Vector2 vector = (Vector2)obj;
            return vector.X == X && vector.Y == Y;
        }

        public override int GetHashCode()
        {
            return X.GetHashCode() + Y.GetHashCode();
        }

        public static Vector2 operator +(Vector2 a, Vector2 b)
        {
            return new Vector2(a.X + b.X, a.Y + b.Y);
        }

        public static Vector2 operator -(Vector2 a)
        {
            return new Vector2(-a.X, -a.Y);
        }

        public static Vector2 operator -(Vector2 a, Vector2 b)
        {
            return new Vector2(a.X - b.X, a.Y - b.Y);
        }

        public static Vector2 operator *(Vector2 a, double factor)
        {
            return new Vector2(a.X * factor, a.Y * factor);
        }

        public static Vector2 operator *(double factor, Vector2 a)
        {
            return new Vector2(a.X * factor, a.Y * factor);
        }

        public static double operator *(Vector2 a, Vector2 b)
        {
            return a.Dot(b);
        }

        public static Vector2 operator /(Vector2 a, double factor)
        {
            return new Vector2(a.X / factor, a.Y / factor);
        }

        public static bool operator ==(Vector2? a, Vector2? b)
        {
            return a?.X == b?.X && a?.Y == b?.Y;
        }

        public static bool operator !=(Vector2? a, Vector2? b)
        {
            return !(a == b);
        }

        /// <summary>
        /// Performs in-place addition
        /// </summary>
        public Vector2 Add(Vector2 a)
        {
            this.X += a.X;
            this.Y += a.Y;

            return this;
        }

        /// <summary>
        /// Performs in-place scalar multiplication
        /// </summary>
        public Vector2 Multiply(double scalar)
        {
            this.X *= scalar;
            this.Y *= scalar;

            return this;
        }

        /// <summary>
        /// Normalizes this vector. Vector remains unchanged in case length is 0.
        /// </summary>
        public Vector2 Normalize()
        {
            double length = Length();

            if (length == 0)
                return this;

            X /= length;
            Y /= length;

            return this;
        }
    }
}
