using Nitro.Geometry;

namespace Nitro.Geography.Projections
{
    public interface Projection
    {
        DoubleVector2 Project(Coordinate coordinate);

        Coordinate Unproject(DoubleVector2 point);
    }
}
