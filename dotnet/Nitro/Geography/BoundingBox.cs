using Nitro.Geometry;
using System.Globalization;

namespace Nitro.Geography
{
    public class BoundingBox
    {
        public double MinX;

        public double MinY;

        public double MinZ;

        public double MaxX;

        public double MaxY;

        public double MaxZ;

        public Coordinate Center
        {
            get
            {
                return new Coordinate((MinX + MaxX) / 2, (MinY + MaxY) / 2, (float) ((MinZ + MaxZ) / 2));
            }
        }
                
        public double MinLatitude
        {
            get { return MinX; }
            set { MinX = value; }
        }

        public double MaxLatitude
        {
            get { return MaxX; }
            set { MaxX = value; }
        }

        public double CenterLatitude
        {
            get
            {
                return (MinX + MaxX) / 2;
            }
        }

        public double MinLongitude
        {
            get { return MinY; }
            set { MinY = value; }
        }

        public double MaxLongitude
        {
            get { return MaxY; }
            set { MaxY = value; }
        }

        public double CenterLongitude
        {
            get
            {
                return (MinY + MaxY) / 2;
            }
        }

        public float MinElevation
        {
            get { return (float)MinZ; }
            set { MinZ = value; }
        }

        public float MaxElevation
        {
            get { return (float)MaxZ; }
            set { MaxZ = value; }
        }

        public float CenterElevation
        {
            get
            {
                return (float)((MinZ + MaxZ) / 2);
            }
        }

        public double DeltaLatitude
        {
            get { return MaxLatitude - MinLatitude; }
        }

        public double DeltaLongitude
        {
            get { return MaxLongitude - MinLongitude; }
        }

        public double DeltaElevation
        {
            get { return MaxElevation - MinElevation; }
        }

        public BoundingBox()
        {
            MinX = MinY = MinZ = double.MaxValue;
            MaxX = MaxY = MaxZ = double.MinValue;
        }

        public BoundingBox(BoundingBox box)
        {
            MinX = box.MinX;
            MinY = box.MinY;
            MinZ = box.MinZ;
            MaxX = box.MaxX;
            MaxY = box.MaxY;
            MaxZ = box.MaxZ;
        }

        public BoundingBox(params Coordinate[] coords) {
            MinX = coords.Min(c => c.Latitude);
            MaxX = coords.Max(c => c.Latitude);
            MinY = coords.Min(c => c.Longitude);
            MaxY = coords.Max(c => c.Longitude);
            MinZ = coords.Min(c => c.Elevation ?? 0);
            MaxZ = coords.Max(c => c.Elevation ?? 0);
        }

        public BoundingBox(double minLatitude, double maxLatitude, double minLongitude, double maxLongitude)
        {
            MinX = Math.Min(minLatitude, maxLatitude);
            MaxX = Math.Max(minLatitude, maxLatitude);
            MinY = Math.Min(minLongitude, maxLongitude);
            MaxY = Math.Max(minLongitude, maxLongitude);
        }

        public static BoundingBox EntirePlanet
        {
            get
            {
                return new BoundingBox(new Coordinate(-90, -180, 0), new Coordinate(90, 180, 0));
            }
        }

        public static BoundingBox Germany
        {
            get
            {
                return new BoundingBox(new Coordinate(54.92, 5.8), new Coordinate(10.21, 15.05));
            }
        }

        public void Add(Coordinate coord)
        {
            MinX = Math.Min(MinX, coord.Latitude);
            MaxX = Math.Max(MaxX, coord.Latitude);
            MinY = Math.Min(MinY, coord.Longitude);
            MaxY = Math.Max(MaxY, coord.Longitude);
            MinZ = Math.Min(MinZ, coord.Elevation ?? 0);
            MaxZ = Math.Max(MaxZ, coord.Elevation ?? 0);
        }

        public void Add(DoubleVector3 coord)
        {
            MinX = Math.Min(MinX, coord.X);
            MaxX = Math.Max(MaxX, coord.X);
            MinY = Math.Min(MinY, coord.Y);
            MaxY = Math.Max(MaxY, coord.Y);
            MinZ = Math.Min(MinZ, coord.Z);
            MaxZ = Math.Max(MaxZ, coord.Z);
        }


        public void Add(BoundingBox bbox)
        {
            MinX = Math.Min(MinX, bbox.MinX);
            MaxX = Math.Max(MaxX, bbox.MaxX);
            MinY = Math.Min(MinY, bbox.MinY);
            MaxY = Math.Max(MaxY, bbox.MaxY);
            MinZ = Math.Min(MinZ, bbox.MinZ);
            MaxZ = Math.Max(MaxZ, bbox.MaxZ);
        }

        /// <summary>
        /// Checks if the given point is contained in this bounding box
        /// </summary>
        /// <param name="point"></param>
        /// <returns></returns>
        public bool Contains(Coordinate point)
        {
            return point.Latitude >= MinX &&
                   point.Latitude <= MaxX &&
                   point.Longitude >= MinY &&
                   point.Longitude <= MaxY &&
                   point.Elevation >= MinZ &&
                   point.Elevation <= MaxZ;
        }

        /// <summary>
        /// Checks BoundingBoxes for true intersection. Bounding Boxes may touch each other!
        /// </summary>
        /// <param name="bbox"></param>
        /// <returns>true, if given bounding box intersects with this instance. Otherwise 
        /// this function returns false. This is also true for bounding boxes with a common edge
        /// but no intersection!</returns>
        public bool Intersects(BoundingBox bbox)
        {
            bool xIntersection = bbox.MinX < this.MaxX && bbox.MaxX > this.MinX;
            bool yIntersection = bbox.MinY < this.MaxY && bbox.MaxY > this.MinY;
            bool zIntersection = bbox.MinZ < this.MaxZ && bbox.MaxZ > this.MinZ;

            return xIntersection && yIntersection && zIntersection;
        }

        public Coordinate Interpolate(double latFactor, double lonFactor)
        {
            return Interpolate(latFactor, lonFactor, 0);
        }

        public Coordinate Interpolate(double latFactor, double lonFactor, double eleFactor)
        {
            return new Coordinate(MaxLatitude - DeltaLatitude * latFactor,
                                  DeltaLongitude * lonFactor + MinLongitude,
                                  (float)(DeltaElevation * eleFactor + MinElevation));
        }

        public static BoundingBox operator +(BoundingBox box, Coordinate point)
        {
            BoundingBox result = new BoundingBox(box);
            result.Add(point);
            return result;
        }

        public static BoundingBox operator +(BoundingBox box1, BoundingBox box2)
        {
            BoundingBox result = new BoundingBox(box1);
            result.Add(box2);
            return result;
        }

        public override bool Equals(object? obj)
        {
            return obj is BoundingBox bbox &&
                   this.MinX == bbox.MinX &&
                   this.MaxX == bbox.MaxX &&
                   this.MinY == bbox.MinY &&
                   this.MaxY == bbox.MaxY &&
                   this.MinZ == bbox.MinZ &&
                   this.MaxZ == bbox.MaxZ;
        }

        public override int GetHashCode()
        {
            return (MaxX - MinX + MaxY - MinY + MaxZ - MinZ).GetHashCode();
        }

        public override string ToString()
        {
            return "X: " + MinX.ToString() + " - " + MaxX.ToString() + ", Y: " + MinY.ToString() + " - " + MaxY.ToString() + ", Z: " + MinZ.ToString() + " - " + MaxZ.ToString();
        }

        public string ToString(NumberFormatInfo info)
        {
            return "X: " + MinX.ToString(info) + " - " + MaxX.ToString(info) + ", Y: " + MinY.ToString(info) + " - " + MaxY.ToString(info) + ", Z: " + MinZ.ToString(info) + " - " + MaxZ.ToString(info);
        }
    }
}
