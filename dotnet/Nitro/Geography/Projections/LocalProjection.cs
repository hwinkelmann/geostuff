using Nitro.Geometry;


namespace Nitro.Geography.Projections
{
    /// <summary>
    /// Fast projection which works fine for local operations
    /// </summary>
    public class LocalProjection : Projection
    {
        Coordinate referencePoint;
        public Coordinate ReferencePoint
        {
            get { return ReferencePoint; }
        }

        double metersPerLatitude;
        public double MetersPerLatitude
        {
            get { return MetersPerLatitude; }
        }

        double metersPerLongitude;
        public double MetersPerLongitude
        {
            get { return MetersPerLongitude; }
        }

        public LocalProjection(Coordinate referencePoint)
        {
            this.referencePoint = referencePoint;

            metersPerLatitude = (6356752.314245 * Math.PI) / 180;
            
            double latRad = (referencePoint.Latitude * Math.PI) / 180;
            double factor = Math.Cos(latRad);

            metersPerLongitude = ((6378137.0 * Math.PI) / 180) * factor;
        }

        public DoubleVector2 Project(Coordinate coordinate)
        {
            double deltaLat = referencePoint.Latitude - coordinate.Latitude;
            double deltaLon = coordinate.Longitude - referencePoint.Longitude;

            return new DoubleVector2(deltaLon * metersPerLongitude, deltaLat * metersPerLatitude);
        }

        public Coordinate Unproject(DoubleVector2 point)
        {
            Coordinate result = new Coordinate();
            result.Latitude = referencePoint.Latitude - point.Y / metersPerLatitude;
            result.Longitude = referencePoint.Longitude + point.X / metersPerLongitude;
            return result;
        }

        public override string ToString()
        {
            return "Reference Point: " + referencePoint.ToString();
        }
    }
}
