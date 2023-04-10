using Nitro.Geometry;

namespace Nitro.Geography.Projections
{
    public class MercatorProjection : Projection
    {
        public DoubleVector2 Project(Coordinate coordinate)
        {
            double latRad = coordinate.Latitude * Math.PI / 180.0;

            DoubleVector2 result = new DoubleVector2();
            result.X = (coordinate.Longitude + 180.0) / 360.0;
            result.Y = (1 - Math.Log(Math.Tan(latRad) + (1.0 / Math.Cos(latRad))) / Math.PI) / 2;
            
            return result;
        }

        public Coordinate Unproject(DoubleVector2 point)
        {
            double xNom = Math.Exp(2 * Math.PI) - Math.Exp(4 * Math.PI * point.Y);
            double xDen = Math.Exp(2 * Math.PI) + Math.Exp(4 * Math.PI * point.Y);

            double yNom = 2 * Math.Exp(-Math.PI * (-1 + 2 * point.Y));
            double yDen = Math.Exp(-2 * Math.PI * (-1 + 2 * point.Y)) + 1;

            Coordinate result = new Coordinate();
            result.Latitude = Math.Atan2(xNom / xDen, yNom / yDen) * 180.0 / Math.PI;
            result.Longitude = -180.0 + (360.0 * point.X);
            
            return result;
        }

        /// <summary>
        /// Calculates projected coordinates for the given zoom level.
        /// Plays well with Geography.Mapping.Descriptor
        /// </summary>
        /// <param name="coordinate">Coordinate to project</param>
        /// <param name="zoom">Target zoom level</param>
        /// <param name="x">x of the projected coordinate</param>
        /// <param name="y">y of the projected coordinate</param>
        public DoubleVector2 ToDescriptorCoordinate(Coordinate coordinate, int zoom)
        {
            DoubleVector2 result = Project(coordinate);

            double multiplyer = Math.Pow(2, zoom);

            result.X *= multiplyer;
            result.Y *= multiplyer;

            return result;
        }

        /// <summary>
        /// Calculates a WGS84 coordinate from a projected one. The reverse function of
        /// ToDescriptorCoordinate.
        /// </summary>
        /// <param name="x"></param>
        /// <param name="y"></param>
        /// <param name="zoom"></param>
        /// <returns></returns>
        public Coordinate FromDescriptorCoordinate(double x, double y, int zoom)
        {
            double multiplyer = Math.Pow(2, zoom);

            x /= multiplyer;
            y /= multiplyer;

            return Unproject(new DoubleVector2(x, y));
        }
    }
}
