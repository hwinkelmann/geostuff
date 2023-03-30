namespace ElevationApi.Dem
{
    /// <summary>
    /// Abstraction for a digital elevation model
    /// </summary>
    public interface IElevationModel
    {
        /// <summary>
        /// Fetches the elevation data for the given point in WGS84 projection
        /// </summary>
        /// <param name="latitude">Latitude</param>
        /// <param name="longitude">Longitude</param>
        /// <returns>Elevation in meters</returns>
        float GetElevation(double latitude, double longitude);
    }
}
