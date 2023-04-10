namespace Nitro.Geometry.Primitives
{
    public class Plane
    {
        /// <summary>
        /// A point on the plane
        /// </summary>
        public DoubleVector3 Point;

        /// <summary>
        /// Normal vector of the plane
        /// </summary>
        public DoubleVector3 Normal;

        /// <summary>
        /// Creates an instance using a point on the plane and the normal vector
        /// </summary>
        /// <param name="point">Arbitrary point on the plane</param>
        /// <param name="normal">Normal vector</param>
        public Plane(DoubleVector3 point, DoubleVector3 normal)
        {
            this.Normal = normal;
            normal.Normalize();

            this.Point = point;
        }

        /// <summary>
        /// Instanciates a plane using 3 points
        /// </summary>
        /// <param name="p1">A point on the plane</param>
        /// <param name="p2">A point on the plane</param>
        /// <param name="p3">A point on the plane</param>
        public Plane(DoubleVector3 p1, DoubleVector3 p2, DoubleVector3 p3)
        {
            DoubleVector3 p12 = p2 - p1;
            DoubleVector3 p13 = p3 - p1;
            DoubleVector3 normal = p12.Cross(p13);
            normal.Normalize();
            
            Normal = normal;
            Point = p1;
        }

        /// <summary>
        /// Copy constructor
        /// </summary>
        /// <param name="plane">Plane to clone</param>
        public Plane(Plane plane)
        {
            this.Point = plane.Point;
            this.Normal = plane.Normal;
        }

        /// <summary>
        /// Calculates the intersection point with the ray
        /// </summary>
        /// <param name="ray">Ray</param>
        /// <returns>Intersection point or null if ray is parallel to the plane
        /// </returns>
        public DoubleVector3? Intersect(Ray ray)
        {
            return ray.Intersect(this);
        }

        /// <summary>
        /// Intersects two planes
        /// </summary>
        /// <param name="plane">Plane</param>
        /// <returns>Intersection ray or null if planes don't intersect</returns>
        public Ray? Intersect(Plane plane)
        {
            if (plane.Normal.IsColinear(Normal))
                return null;

            double d1 = this.Normal.Dot(this.Point);
            double d2 = plane.Normal.Dot(plane.Point);

            double determinant = this.Normal.Dot(this.Normal) * plane.Normal.Dot(plane.Normal) - Math.Pow(this.Normal.Dot(plane.Normal), 2);

            double c1 = (d1 * plane.Normal.Dot(plane.Normal) - d2 * this.Normal.Dot(plane.Normal)) / determinant;
            double c2 = (d2 * this.Normal.Dot(this.Normal) - d1 * this.Normal.Dot(plane.Normal)) / determinant;

            Ray result = new Ray();
            
            result.PointA = c1 * Normal + c2 * plane.Normal;
            result.Direction = Normal.Cross(plane.Normal);

            return result;
        }

        public double DistanceTo(DoubleVector3 point)
        {
            DoubleVector3 v = point - Point;
            return Math.Abs(v.Dot(Normal));
        }
    }
}
