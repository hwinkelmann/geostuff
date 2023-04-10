using Nitro.Geometry;
using System.Globalization;
using System.Text.Json.Serialization;

namespace Nitro.Geography
{
    public class Coordinate
    {
        public double Latitude { get; set; }

        public double Longitude { get; set; }

        public float? Elevation { get; set; }
        
        public Coordinate()
        {
            Latitude = Longitude = 0;
            Elevation = 0;
        }

        public Coordinate(double latitude, double longitude) : this(latitude, longitude, 0) { }

        public Coordinate(double latitude, double longitude, float elevation)
        {
            Latitude = latitude;
            Longitude = longitude;
            Elevation = elevation;
        }

        public Coordinate(Coordinate coordinate)
        {
            this.Latitude = coordinate.Latitude;
            this.Longitude = coordinate.Longitude;
            this.Elevation = coordinate.Elevation;
        }

        public double BearingTo(Coordinate coordinate)
        {
            return BearingTo(this.Latitude, this.Longitude, coordinate.Latitude, coordinate.Longitude);
        }

        /// <summary>
        /// Calculates the bearing from this coordinate to another
        /// </summary>
        /// <param name="fromLatitude"></param>
        /// <param name="fromLongitude"></param>
        /// <param name="toLatitude"></param>
        /// <param name="toLongitude"></param>
        /// <returns>Bearing in degrees, 0=north, 90=east...</returns>
        public static double BearingTo(double fromLatitude, double fromLongitude, double toLatitude, double toLongitude)
        {
            if (fromLatitude == toLatitude && fromLongitude == toLongitude)
                return 0;

            double latFromRad = fromLatitude * Math.PI / 180.0;
            double latToRad = toLatitude * Math.PI / 180.0;
            double lonFromRad = fromLongitude * Math.PI / 180.0;
            double lonToRad = toLongitude * Math.PI / 180.0;

            double x = Math.Cos(latFromRad) * Math.Sin(latToRad) - Math.Sin(latFromRad) * Math.Cos(latToRad) * Math.Cos(lonFromRad - lonToRad);
            double y = -Math.Sin(lonFromRad - lonToRad) * Math.Cos(latToRad);

            return (Math.Atan2(y, x) * 180.0 / Math.PI);
        }

        public void ClampLongitude()
        {
            while (Longitude < -180)
                Longitude += 360;

            while (Longitude > 180)
                Longitude -= 360;
        }

        [JsonIgnore]
        public bool IsOk
        {
            get
            {
                return !double.IsNaN(Latitude) && !double.IsNaN(Longitude) && Latitude >= -180 && Latitude <= 180 && Longitude >= -90 && Longitude <= 90;
            }
        }

        public override int GetHashCode()
        {
            return Latitude.GetHashCode() + Longitude.GetHashCode();
        }

        public override string ToString()
        {
            String ns = (Latitude >= 0) ? "N" : "S";
            String ew = (Longitude >= 0) ? "E" : "W";

            return String.Format(NumberFormatInfo.InvariantInfo, "{0:0.00000}", Math.Abs(Latitude)) + "° " + ns + ", " +
                String.Format(NumberFormatInfo.InvariantInfo, "{0:0.00000}", Math.Abs(Longitude)) + "° " + ew;
        }

        public string ToString(NumberFormatInfo info)
        {
            String ns = (Latitude >= 0) ? "N" : "S";
            String ew = (Longitude >= 0) ? "E" : "W";

            return String.Format(info, "{0:0.00000}", Math.Abs(Latitude)) + "° " + ns + ", " +
                String.Format(info, "{0:0.00000}", Math.Abs(Longitude)) + "° " + ew;
        }

        public override bool Equals(object? obj)
        {
            return obj is Coordinate coordinate &&
                   Latitude == coordinate.Latitude &&
                   Longitude == coordinate.Longitude &&
                   Elevation == coordinate.Elevation;
        }
        
        public static bool operator ==(Coordinate a, Coordinate b)
        {
            if (System.Object.ReferenceEquals(a, b))
                return true;

            if (((object)a) == null || ((object)b) == null)
                return false;

            return a.Latitude == b.Latitude && a.Longitude == b.Longitude && a.Elevation == b.Elevation;
        }

        public static bool operator !=(Coordinate a, Coordinate b)
        {
            return !(a == b);
        }

        public static implicit operator DoubleVector2(Coordinate coord)
        {
            return new DoubleVector2(coord.Latitude, coord.Longitude);
        }

        public static implicit operator DoubleVector3(Coordinate coord)
        {
            return new DoubleVector3(coord.Latitude, coord.Longitude, coord.Elevation ?? 0);
        }

        public static implicit operator Coordinate(DoubleVector2 vec)
        {
            return new Coordinate(vec.X, vec.Y);
        }

        public static implicit operator Coordinate(DoubleVector3 vec)
        {
            return new Coordinate(vec.X, vec.Y, (float)vec.Z);
        }
    }
}
