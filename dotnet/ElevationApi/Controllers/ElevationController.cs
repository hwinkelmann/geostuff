using BitMiracle.LibTiff.Classic;
using ElevationApi.Dem;
using Microsoft.AspNetCore.Mvc;
using Nitro.Geography;
using System.Reflection;

/// <summary>
/// Elevation Controller
/// </summary>
[ApiController]
[Route("elevation")]
public class ElevationController : ControllerBase {
    private readonly double REALLY_SMALL_NUMBER = 0.00001;

    private readonly double MAX_AREA_SIZE = 4;

    private readonly ILogger<ElevationController> _logger;

    private readonly IElevationModel _elevation;

    /// <summary>
    /// Creates a new controller instance
    /// </summary>
    /// <param name="logger">Logger instance to use</param>
    /// <param name="elevation">digital elevation model</param>
    public ElevationController(ILogger<ElevationController> logger, IElevationModel elevation) {
        this._logger = logger;
        this._elevation = elevation;
    }

    /// <summary>
    /// Returns the elevation at a given coordinate
    /// </summary>
    /// <param name="latitude">Latitude</param>
    /// <param name="longitude">Longitude</param>
    /// <returns>Elevation in meters</returns>
    [HttpGet]
    [Route("at")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [Produces(typeof(Coordinate))]
    public IActionResult GetAt([FromQuery] double latitude, [FromQuery] double longitude) {
        return Ok(new Coordinate(latitude, longitude, _elevation.GetElevation(latitude, longitude)));
    }

    /// <summary>
    /// Returns a geotiff containing elevation data of the requested area
    /// </summary>
    /// <param name="_minLatitude">Latitude 1</param>
    /// <param name="_maxLatitude">Latitude 2</param>
    /// <param name="_minLongitude">Longitude 1</param>
    /// <param name="_maxLongitude">Longitude 2</param>
    /// <param name="_resolution">Resolution of the generated geo tiff image</param>
    /// <returns>geotiff image</returns>
    [HttpGet]
    [Route("area")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult GetArea([FromQuery(Name = "minLatitude")] double _minLatitude, [FromQuery(Name = "maxLatitude")] double _maxLatitude, [FromQuery(Name = "minLongitude")] double _minLongitude, [FromQuery(Name = "maxLongitude")] double _maxLongitude, [FromQuery(Name = "resolution")] int _resolution = 256)
    {
        // Parameter parsing and range check
        var resolution = Math.Max(16, Math.Min(512, _resolution));
        var min = new Coordinate(Math.Min(_minLatitude, _maxLatitude), Math.Min(_minLongitude, _maxLongitude));
        var max = new Coordinate(Math.Max(_minLatitude, _maxLatitude), Math.Max(_minLongitude, _maxLongitude));

        var bbox = new BoundingBox(min, max);
        if (bbox.DeltaLatitude < REALLY_SMALL_NUMBER ||
            bbox.DeltaLongitude < REALLY_SMALL_NUMBER)
            return badRequest("AREA_TOO_SMALL", "The requested area is too small. Try making it bigger!");

        if (bbox.DeltaLatitude > MAX_AREA_SIZE ||
            bbox.DeltaLongitude > MAX_AREA_SIZE)
            return badRequest("AREA_TOO_BIG", "The requested area is too big. Maximum size is " + MAX_AREA_SIZE + "x" + MAX_AREA_SIZE);

        var tiff = generateTiff(bbox, resolution);
        tiff.Flush();

        return Ok(tiff);
    }

    private Tiff generateTiff(BoundingBox bounds, int resolution) 
    {
        using (var output = Tiff.Open("test.tiff", "w"))
        {
            output.SetField(TiffTag.IMAGEWIDTH, resolution);
            output.SetField(TiffTag.IMAGELENGTH, resolution);
            output.SetField(TiffTag.SAMPLESPERPIXEL, 1);
            output.SetField(TiffTag.BITSPERSAMPLE, 16);
            output.SetField(TiffTag.COMPRESSION, Compression.NONE);

            var buffer = new byte[resolution * 2];
            for (int y=0; y<resolution; y++)
            {
                double yScale = (double)y / ((double)resolution - 1.0);

                for (int x=0; x<resolution; x++)
                {
                    double xScale = (double)x / ((double)resolution - 1.0);
                    double latitude = bounds.MaxLatitude - yScale * bounds.DeltaLatitude;
                    double longitude = bounds.MinLongitude + xScale * bounds.DeltaLongitude;

                    float? elevation = _elevation.GetElevation(latitude, longitude);

                    var shortElevation = (short)Math.Round(elevation ?? 0);

                    buffer[x * 2] = (byte)(shortElevation >> 8);
                    buffer[x * 2 + 1] = (byte)(shortElevation & 255);
                }

                output.WriteScanline(buffer, y);
            }

            return output;
        }
    }

    private BadRequestObjectResult badRequest(string code, string msg)
    {
        return BadRequest(new
        {
            code = code,
            msg = msg
        });
    }
}