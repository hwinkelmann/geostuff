namespace Nitro.Geometry
{
    public class Intersection
    {
        /// <summary>
        /// Calculates intersection point of two lines with infinite length.
        /// The first ray passes through a1,a2 and the second through b1,b2
        /// </summary>
        /// <returns>Intersection point or (NaN/NaN) if rays are parallel</returns>
        public static Vector2 IntersectRayRay(Vector2 a1, Vector2 a2, Vector2 b1, Vector2 b2)
        {
            double denominator = (a1.X - a2.X) * (b1.Y - b2.Y) - (a1.Y - a2.Y) * (b1.X - b2.X);
            if (Math.Abs(denominator) < 0.0000001)
                return new Vector2(double.NaN, double.NaN);

            double xnom = (a1.X * a2.Y - a1.Y * a2.X) * (b1.X - b2.X) - (a1.X - a2.X) * (b1.X * b2.Y - b1.Y * b2.X);
            double ynom = (a1.X * a2.Y - a1.Y * a2.X) * (b1.Y - b2.Y) - (a1.Y - a2.Y) * (b1.X * b2.Y - b1.Y * b2.X);

            return new Vector2(xnom / denominator, ynom / denominator);
        }
    }
}
