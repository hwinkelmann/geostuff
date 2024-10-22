using ElevationApi.Dem;
using ICSharpCode.SharpZipLib.GZip;
using Nitro.Geography;

/// <summary>
/// Caches generated tiles on disk, so we don't need to re-generate
/// </summary>
public class TileCache {
    private string? _cacheFolder;

    private IElevationModel _elevation;

    /// <summary>
    /// Constructor
    /// </summary>
    /// <param name="cacheFolder">Folder where to store cached files</param>
    /// <param name="elevation">Elevation model</param>
    public TileCache(string? cacheFolder, IElevationModel elevation)
    {
        _cacheFolder = cacheFolder;
        _elevation = elevation;
    }

    /// <summary>
    /// Returns a tile. Checks the cache, and generates it in case of a cache miss.
    /// </summary>
    /// <param name="bounds">Tile bounds</param>
    /// <param name="resolution">Tile resolution</param>
    /// <returns>elevation data</returns>
    public async Task<byte[]> GetTile(BoundingBox bounds, int resolution)
    {
        if (_cacheFolder == null)
        {
            // Caching is disabled
            return await GenerateBinaryTile(bounds, resolution);
        }
     
        var file = GetCacheFilename(bounds, resolution);
        if (File.Exists(file))
            return await File.ReadAllBytesAsync(file);

        var result = await GenerateBinaryTile(bounds, resolution);
        await File.WriteAllBytesAsync(file, result);
        return result;
    }

    private async Task<byte[]> GenerateBinaryTile(BoundingBox bounds, int resolution)
    {
        using (var outMs = new MemoryStream())
        {
            using (var zipStream = new GZipOutputStream(outMs))
            using (var writer = new BinaryWriter(zipStream))
            {
                for (int y = 0; y < resolution; y++)
                {
                    double yScale = y / (resolution - 1.0);

                    for (int x = 0; x < resolution; x++)
                    {
                        double xScale = x / (resolution - 1.0);
                        double latitude = bounds.MaxLatitude - yScale * bounds.DeltaLatitude;
                        double longitude = bounds.MinLongitude + xScale * bounds.DeltaLongitude;

                        float? elevation = await _elevation.GetElevation(latitude, longitude);

                        writer.Write((short)Math.Round(elevation ?? 0));
                    }
                }

                writer.Flush();
                await zipStream.FlushAsync();
            }

            return outMs.ToArray();
        }
    }

    private string GetCacheFilename(BoundingBox bounds, int resolution)
    {
        var key = new byte[18];
        Buffer.BlockCopy(BitConverter.GetBytes((float)bounds.MinLatitude), 0, key, 0, 4);
        Buffer.BlockCopy(BitConverter.GetBytes((float)bounds.MaxLatitude), 0, key, 4, 4);
        Buffer.BlockCopy(BitConverter.GetBytes((float)bounds.MinLongitude), 0, key, 8, 4);
        Buffer.BlockCopy(BitConverter.GetBytes((float)bounds.MaxLongitude), 0, key, 12, 4);
        Buffer.BlockCopy(BitConverter.GetBytes((ushort)resolution), 0, key, 16, 2);

        return _cacheFolder + Path.DirectorySeparatorChar + Convert.ToBase64String(key) + ".bin.gzip";
    }
}