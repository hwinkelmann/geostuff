namespace Nitro.Geometry
{
    public class Intersection
    {
        /// <summary>
        /// Calculates intersection point of two lines with infinite length.
        /// The first ray passes through a1,a2 and the second through b1,b2
        /// </summary>
        /// <returns>Intersection point or (NaN/NaN) if rays are parallel</returns>
        public static DoubleVector2 IntersectRayRay(DoubleVector2 a1, DoubleVector2 a2, DoubleVector2 b1, DoubleVector2 b2)
        {
            double denominator = (a1.X - a2.X) * (b1.Y - b2.Y) - (a1.Y - a2.Y) * (b1.X - b2.X);
            if (Math.Abs(denominator) < 0.0000001)
                return new DoubleVector2(double.NaN, double.NaN);

            double xnom = (a1.X * a2.Y - a1.Y * a2.X) * (b1.X - b2.X) - (a1.X - a2.X) * (b1.X * b2.Y - b1.Y * b2.X);
            double ynom = (a1.X * a2.Y - a1.Y * a2.X) * (b1.Y - b2.Y) - (a1.Y - a2.Y) * (b1.X * b2.Y - b1.Y * b2.X);

            return new DoubleVector2(xnom / denominator, ynom / denominator);
        }
    }
}
