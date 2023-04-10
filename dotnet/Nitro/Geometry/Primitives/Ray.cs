namespace Nitro.Geometry.Primitives
{
    public class Ray
    {
        /// <summary>
        /// A point on the ray
        /// </summary>
        public DoubleVector3 PointA;

        /// <summary>
        /// Another point on the ray. Must be different from PointA
        /// </summary>
        public DoubleVector3 PointB;

        #region Properties
        /// <summary>
        /// Normalized direction vector
        /// </summary>
        public DoubleVector3 Direction
        {
            get
            {
                DoubleVector3 result = PointB - PointA;
                result.Normalize();
                return result;
            }

            set
            {
                PointB = PointA + value;
            }
        }
        #endregion

        #region Constructors

        /// <summary>
        /// Default constructor
        /// </summary>
        public Ray()
        {
            PointA = new DoubleVector3();
            PointB = new DoubleVector3();
        }

        /// <summary>
        /// Creates ray from point and direction
        /// </summary>
        /// <param name="point">A point on the ray</param>
        /// <param name="direction">Direction</param>
        public Ray(DoubleVector3 point, DoubleVector3 direction)
        {
            this.PointA = point;
            this.PointB = PointA + direction;
        }

        /// <summary>
        /// Copy constructor
        /// </summary>
        /// <param name="ray">The ray to clone</param>
        public Ray(Ray ray)
        {
            this.PointA = ray.PointA;
            this.PointB = ray.PointB;
        }

        /// <summary>
        /// Creates a ray instance from two points
        /// </summary>
        public static Ray FromPoints(DoubleVector3 a, DoubleVector3 b)
        {
            Ray result = new Ray();

            result.PointA = a;
            result.PointB = b;

            return result;
        }

        public static Ray FromPoints(double x1, double y1, double z1, double x2, double y2, double z2)
        {
            Ray result = new Ray();

            result.PointA.X = x1;
            result.PointA.Y = y1;
            result.PointA.Z = z1;
            result.PointB.X = x2;
            result.PointB.Y = y2;
            result.PointB.Z = z2;

            return result;
        }
        #endregion

        #region Intersection
        /// <summary>
        /// Calculates the intersection point of this ray with a plane.
        /// </summary>
        /// <param name="plane">Plane to intersect ray with</param>
        /// <returns>Intersection point or null if the ray does not intersect with the plane</returns>
        public DoubleVector3? Intersect(Plane plane)
        {
            // See Bourke, http://local.wasp.uwa.edu.au/~pbourke/geometry/planeline/
            double denom = plane.Normal.Dot(Direction);

            if (Math.Abs(denom) < 0.000000001)
                return null;

            double d = (plane.Point - PointA).Dot(plane.Normal) / denom;

            return PointA + Direction * d;
        }
        #endregion

        #region Operations
        /// <summary>
        /// Projects point on this ray. Returns s, which satisfies
        /// pointProjected = this.Direction * s + this.PointA
        /// </summary>
        /// <param name="point">Point to project on this ray</param>
        public double PerpendicularFactor(DoubleVector3 point)
        {
            DoubleVector3 direction = PointB - PointA;
            DoubleVector3 w = point - PointA;

            double denominator = direction.Dot(direction);
            if (denominator < 0.00000000001)
                return double.NaN;

            return w.Dot(direction) / denominator;
        }
        #endregion

        #region Distance
        /// <summary>
        /// Calculates distance between this ray and the point specified
        /// </summary>
        /// <returns>Distance to the point or double.NaN, is start and end of this point are identical</returns>
        public double DistanceTo(DoubleVector3 point)
        {
            // http://mathworld.wolfram.com/Point-LineDistance3-Dimensional.html
            double denom = (PointB - PointA).LengthSq();

            if (denom < 0.0000000001)
                return double.NaN;

            return Math.Sqrt(((PointB - PointA).Cross(PointA - point).LengthSq()) / denom);
        }

        /// <summary>
        /// Distance of the specified point to the line segment between PointA and PointB
        /// </summary>
        public double SegmentDistanceTo(DoubleVector3 point)
        {
            double factor = PerpendicularFactor(point);

            if (factor <= 0)
                return PointA.DistanceTo(point);

            if (factor >= 1)
                return PointB.DistanceTo(point);

            DoubleVector3 perpendicular = PointA + (PointB - PointA) * factor;
            return perpendicular.DistanceTo(point);
        }
        #endregion
    }
}
