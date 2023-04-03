using Nitro.Geography.Projections;
using Nitro.Geography;

namespace NitroGis.Geography.Mapping
{
    /// <summary>
    /// Tile addressing descriptor
    /// </summary>
    public class TileDescriptor
    {
        static MercatorProjection projection = new MercatorProjection();

        /// <summary>
        /// X-coordinate of the tile
        /// </summary>
        public int X;

        /// <summary>
        /// Y-coordinate of the tile
        /// </summary>
        public int Y;

        /// <summary>
        /// zoom level of this tile (0 = whole earth fits in a single tile)
        /// </summary>
        public byte Zoom;

        public TileDescriptor() { }

        /// <summary>
        /// Default constructor
        /// </summary>
        /// <param name="x">x</param>
        /// <param name="y">y</param>
        /// <param name="zoom">zoom</param>
        public TileDescriptor(int x, int y, int zoom)
        {
            X = x;
            Y = y;
            Zoom = (byte)zoom;
        }

        public TileDescriptor(TileDescriptor desc)
        {
            X = desc.X;
            Y = desc.Y;
            Zoom = desc.Zoom;
        }

        /// <summary>
        /// Creates the an instance that contains the coordinate specified
        /// at the given zoom level
        /// </summary>
        /// <param name="coord">Coordinate to contain</param>
        /// <param name="level">Zoom level</param>
        public TileDescriptor(Coordinate coord, int level)
        {
            var vec = projection.Project(coord);
            X = (int)(vec.X * (1 << level));
            Y = (int)(vec.Y * (1 << level));
            Zoom = (byte)level;
        }

        public int TilesWidth
        {
            get
            {
                return (int)Math.Pow(2, Zoom);
            }
        }

        public TileDescriptor GetParent()
        {
            if (Zoom > 0)
                return new TileDescriptor(X / 2, Y / 2, Zoom - 1);
            else
                return new TileDescriptor(this);
        }

        public BoundingBox GetBounds()
        {
            return new BoundingBox(new[] {
                projection.FromDescriptorCoordinate(X, Y, Zoom),
                projection.FromDescriptorCoordinate(X + 1, Y + 1, Zoom),
            });
        }

        #region Overrides
        public override bool Equals(object? obj)
        {
            if (obj is not TileDescriptor || obj == null)
                return false;

            TileDescriptor desc = (TileDescriptor)obj;
            return desc.X == X && desc.Y == Y && desc.Zoom == Zoom;
        }

        public override string ToString()
        {
            return X.ToString() + ", " + Y.ToString() + ", " + Zoom.ToString();
        }

        public override int GetHashCode()
        {
            return (X + Y * 1000) * Zoom;
        }
        #endregion
    }
}
