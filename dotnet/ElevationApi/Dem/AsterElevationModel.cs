using ICSharpCode.SharpZipLib.Zip;
using Nitro.Data.Cache;

namespace ElevationApi.Dem
{
    /// <summary>
    /// Implements access to ASTGTM_*.zip files
    /// </summary>
    public class AsterElevationModel : IElevationModel
    {
        /// <summary>
        /// Folder of the zipped aster data files
        /// </summary>
        string dataDirectory = ".\\";

        /// <summary>
        /// Gives a first indication where we have landmass
        /// </summary>
        private bool[,] dataExists = new bool[361, 181];

        private SimpleCache<int, short[,]> cache = new(32);

        /// <summary>
        /// Creates a new instance
        /// </summary>
        /// <param name="dataDirectory">Folder of the zipped aster data files</param>
        public AsterElevationModel(string dataDirectory)
        {
            this.dataDirectory = dataDirectory;

            for (int x = -180; x < 180; x++)
                for (int y = 90; y > -90; y--)
                    dataExists[x + 180, y + 90] = File.Exists(GetTileFilename(y, x));
        }

        /// <inheritdoc/>
        public async Task<float> GetElevation(double latitude, double longitude)
        {
            latitude = ClampLatitude(latitude);
            longitude = ClampLongitude(longitude);

            // Load aster tile
            var iLat = (int)Math.Floor(latitude);
            var iLon = (int)Math.Floor(longitude);

            var tile = await GetDemAsync(iLat, iLon);

            // If no tile is available, we're querying a coordinate in the sea. That's
            // 0 meters above sea level.
            if (tile == null)
                return 0;

            // get fractions
            float fractionLatitude = (float)(latitude - iLat);
            float fractionLongitude = (float)(longitude - iLon);

            // map these to the top left pixel of the tile. tiles overlap by 1 pixel,
            // so we're multiplying with data.Size - 1
            var size = tile.GetLength(0);
            float py = size - 1 - fractionLatitude * (size - 1);
            float px = fractionLongitude * (size - 1);

            int px_int = (int)Math.Floor(px);
            int py_int = (int)Math.Floor(py);

            int px_int_inc = Math.Min(px_int + 1, size - 1);
            int py_int_inc = Math.Min(py_int + 1, size - 1);

            // bilinear filtering
            float ratioX = px - px_int;
            float ratioY = py - py_int;

            float R1 = tile[px_int, py_int] * (1 - ratioX) + tile[px_int_inc, py_int] * ratioX;
            float R2 = tile[px_int, py_int_inc] * (1 - ratioX) + tile[px_int_inc, py_int_inc] * ratioX;

            return R1 * (1 - ratioY) + R2 * ratioY;
        }

        /// <summary>
        /// Gets hold of the aster tile referenced by latitude/longitude
        /// </summary>
        /// <param name="latitude">Latitude</param>
        /// <param name="longitude">Longitude</param>
        /// <returns>The requested aster tile</returns>
        private async Task<short[,]?> GetDemAsync(int latitude, int longitude)
        {
            if (!dataExists[longitude + 180, latitude + 90])
                return null;

            var key = GetCacheKey(latitude, longitude);

            short[,]? data;
            lock (cache)
            {
                data = cache.Get(key);
                if (data != null)
                    return data;
            }

            data = await LoadAsterTileAsync(latitude, longitude);
            if (data == null)
            {
                // this should never happen unless you delete data files
                // while the server is running.
                dataExists[longitude + 180, latitude + 90] = false;
                return null;
            }
            
            lock (cache)
                cache.Add(key, data);

            return data;
        }

        /// <summary>
        /// Loads an aster tile
        /// </summary>
        /// <param name="latitude">Latitude</param>
        /// <param name="longitude">Longitude</param>
        /// <returns>The requested aster tile</returns>
        private async Task<short[,]?> LoadAsterTileAsync(int latitude, int longitude)
        {
            var filename = GetTileFilename(latitude, longitude);
            if (!File.Exists(filename))
                return null;

            using (var zipStream = new ZipInputStream(File.OpenRead(filename)))
            {
                ZipEntry? zipEntry = null;

                while (zipEntry == null || !zipEntry.Name.EndsWith("dem.tif"))
                    zipEntry = zipStream.GetNextEntry();

                // unzip
                byte[] buffer = new byte[zipEntry.Size];
                await zipStream.ReadAsync(buffer, 0, 8);
                await zipStream.ReadAsync(buffer, 0, (int)zipEntry.Size);

                // adjust endianess (aster files are big endian)
                if (!BitConverter.IsLittleEndian)
                    for (int i = 0; i < buffer.Length; i += 2)
                    {
                        byte dummy = buffer[i];
                        buffer[i] = buffer[i + 1];
                        buffer[i + 1] = dummy;
                    }

                // read data
                int pos = 0;
                int size = 3601;
                var data = new short[size, size];
                for (int y = 0; y < size; y++)
                    for (int x = 0; x < size; x++, pos += 2)
                        data[x, y] = BitConverter.ToInt16(buffer, pos);

                return data;
            }
        }

        private string GetTileFilename(int latitude, int longitude)
        {
            var NS = (latitude < 0) ? "S" : "N";
            var EW = (longitude < 0) ? "W" : "E";

            var latHeading = NS + string.Format("{0:00}", Math.Abs(latitude));
            var lonHeading = EW + string.Format("{0:000}", Math.Abs(longitude));

            return dataDirectory + Path.DirectorySeparatorChar + "ASTGTM_" + latHeading + lonHeading + ".zip";
        }

        private static double ClampLatitude(double latitude)
        {
            // Handle over- and underflow
            while (latitude < -180)
                latitude += 360;

            while (latitude > 180)
                latitude -= 360;

            return latitude;
        }

        private static double ClampLongitude(double longitude)
        {
            while (longitude < -180)
                longitude += 360;

            while (longitude > 180)
                longitude -= 360;

            return longitude;
        }

        private static int GetCacheKey(int latitude, int longitude)
        {
            return ((latitude + 90) << 10) + (longitude + 180);
        }

    }
}
