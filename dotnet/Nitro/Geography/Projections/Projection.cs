using Nitro.Geometry;

namespace Nitro.Geography.Projections
{
    public interface Projection
    {
        Vector2 Project(Coordinate coordinate);

        Coordinate Unproject(Vector2 point);
    }
}
