using Nitro.Geometry;


namespace Nitro.Geography
{
    public class Datum
    {
        public static Datum WGS84 = new Datum(6378137, 1.0 / 298.257223563, 0, 0, 0);

        protected double a;
        protected double b;
        protected double e;
        protected double e_;
        protected double f;
        protected double xShift;
        protected double yShift;
        protected double zShift;

        public Datum(double a, double f, double xShift, double yShift, double zShift)
        {
            this.a = a;
            this.f = f;
            this.b = a * (1 - f);
            this.xShift = xShift;
            this.yShift = yShift;
            this.zShift = zShift;

            e = Math.Sqrt((a * a - b * b) / (a * a));
            e_ = Math.Sqrt((a * a - b * b) / (b * b));
        }

        public Vector3 ToCarthesian(Coordinate coordinate)
        {
            double radLat = (Math.PI / 180) * coordinate.Latitude;
            double radLon = (Math.PI / 180) * coordinate.Longitude;

            double N = radiusOfCurvature(coordinate.Latitude);

            Vector3 Result = new Vector3();
            Result.X = ((N + coordinate.Elevation ?? 0) * Math.Cos(radLat) * Math.Cos(radLon) + xShift);
            Result.Y = ((N + coordinate.Elevation ?? 0) * Math.Cos(radLat) * Math.Sin(radLon) + yShift);
            Result.Z = (((b * b * N) / (a * a)) * Math.Sin(radLat) + zShift);

            return Result;
        }

        public double Distance(Coordinate from, Coordinate to)
        {
            Vector3 diff = ToCarthesian(from) - ToCarthesian(to);
            return diff.Length();
        }

        public Coordinate FromCarthesian(Vector3 position)
        {
            Coordinate coord = new Coordinate();

            coord.Longitude = Math.Atan2(position.Y, position.X) * 180.0 / Math.PI;

            double p = Math.Sqrt((double)position.X * (double)position.X + (double)position.Y * (double)position.Y);
            double theta = Math.Atan2((double)position.Z * a, p * b);
            double phi = Math.Atan2((double) position.Z + e_ * e_ * b * Math.Pow(Math.Sin(theta), 3), p - e * e * a * Math.Pow(Math.Cos(theta), 3));

            coord.Latitude = phi * 180.0 / Math.PI;
            coord.Elevation =(float)(p / Math.Cos(phi) - radiusOfCurvature(coord.Latitude));

            return coord;
        }

        protected double radiusOfCurvature(double latitude)
        {
            return a / Math.Sqrt(1 - e * e * Math.Pow(Math.Sin(latitude * Math.PI / 180.0), 2));
        }
    }
}
