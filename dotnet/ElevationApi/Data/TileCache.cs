using BitMiracle.LibTiff.Classic;
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
    /// <returns>tiff file</returns>
    public byte[] GetTile(BoundingBox bounds, int resolution)
    {
        if (_cacheFolder == null)
        {
            // Caching is disabled
            return generateTiff(bounds, resolution);
        }
     
        var file = getCacheFilename(bounds, resolution);
        if (File.Exists(file))
            return File.ReadAllBytes(file);

        var result = generateTiff(bounds, resolution);
        File.WriteAllBytes(file, result);
        return result;
    }

    private byte[] generateTiff(BoundingBox bounds, int resolution)
    {
        var tiffStream = new TiffStream();
        using (var ms = new MemoryStream())
        using (var output = Tiff.ClientOpen("", "w", ms, tiffStream))
        {
            output.SetField(TiffTag.IMAGEWIDTH, resolution);
            output.SetField(TiffTag.IMAGELENGTH, resolution);
            output.SetField(TiffTag.SAMPLESPERPIXEL, 1);
            output.SetField(TiffTag.BITSPERSAMPLE, 16);
            output.SetField(TiffTag.COMPRESSION, Compression.NONE);

            var buffer = new byte[resolution * 2];
            for (int y = 0; y < resolution; y++)
            {
                double yScale = y / (resolution - 1.0);

                for (int x = 0; x < resolution; x++)
                {
                    double xScale = x / (resolution - 1.0);
                    double latitude = bounds.MaxLatitude - yScale * bounds.DeltaLatitude;
                    double longitude = bounds.MinLongitude + xScale * bounds.DeltaLongitude;

                    float? elevation = _elevation.GetElevation(latitude, longitude);

                    var shortElevation = (short)Math.Round(elevation ?? 0);

                    buffer[x * 2] = (byte)(shortElevation & 255);
                    buffer[x * 2 + 1] = (byte)(shortElevation >> 8);
                }

                output.WriteScanline(buffer, y);
            }

            output.Flush();

            using (var outMs = new MemoryStream())
            using (var zipStream = new GZipOutputStream(outMs))
            {
                zipStream.Write(((MemoryStream)output.Clientdata()).ToArray());
                zipStream.Flush();
                return outMs.ToArray();
            }
        }
    }
    
    private string getCacheFilename(BoundingBox bounds, int resolution)
    {
        var key = new byte[18];
        Buffer.BlockCopy(BitConverter.GetBytes((float)bounds.MinLatitude), 0, key, 0, 4);
        Buffer.BlockCopy(BitConverter.GetBytes((float)bounds.MaxLatitude), 0, key, 4, 4);
        Buffer.BlockCopy(BitConverter.GetBytes((float)bounds.MinLongitude), 0, key, 8, 4);
        Buffer.BlockCopy(BitConverter.GetBytes((float)bounds.MaxLongitude), 0, key, 12, 4);
        Buffer.BlockCopy(BitConverter.GetBytes((ushort)resolution), 0, key, 16, 2);

        return _cacheFolder + Path.DirectorySeparatorChar + Convert.ToBase64String(key) + ".tiff.gzip";
    }
}