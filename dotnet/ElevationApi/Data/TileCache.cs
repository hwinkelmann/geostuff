using ElevationApi.Dem;
using ICSharpCode.SharpZipLib.GZip;
using Nitro.Geography;
using NitroGis.Geography.Mapping;

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

    private void prefillCache(int[] zoomLevels)
    {
        foreach (var zoom in zoomLevels)
        {
            var stride = Math.Pow(2, zoom);

            for (int x=0; x<stride; x++)
                for (int y=0; y<stride; y++)
                {
                    var desc = new TileDescriptor(x, y, zoom);
                    Console.WriteLine("Prepopulating cache at " + desc.ToString());

                    GetTile(desc, 256).Wait();
                }
        }
    }

    /// <summary>
    /// Returns a tile. Checks the cache, and generates it in case of a cache miss.
    /// </summary>
    /// <param name="desc">Descriptor</param>
    /// <param name="resolution">Tile resolution</param>
    /// <returns>elevation data</returns>
    public async Task<byte[]> GetTile(TileDescriptor desc, int resolution)
    {
        var bounds = desc.GetBounds();

        if (_cacheFolder == null)
        {
            // Caching is disabled
            return await GenerateBinaryTile(bounds, resolution);
        }
     
        var file = GetCacheFilename(desc, resolution);
        if (File.Exists(file))
            return await File.ReadAllBytesAsync(file);

        var result = await GenerateBinaryTile(bounds, resolution);

        var dir = Path.GetDirectoryName(file);
        if (dir != null && !Directory.Exists(dir))
            Directory.CreateDirectory(dir);

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
    private string GetCacheFilename(TileDescriptor desc, int resolution)
    {
        return _cacheFolder + 
            Path.DirectorySeparatorChar + 
            desc.Zoom.ToString() +
            Path.DirectorySeparatorChar +
            desc.X.ToString() +
            Path.DirectorySeparatorChar +
            desc.Y.ToString() +
            ".bin.gz";
    }
}