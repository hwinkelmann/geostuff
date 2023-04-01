using BitMiracle.LibTiff.Classic;
using ElevationApi.Dem;
using Microsoft.AspNetCore.Mvc;
using Nitro.Geography;

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

    private readonly TileCache _cache;

    /// <summary>
    /// Creates a new controller instance
    /// </summary>
    /// <param name="logger">Logger instance to use</param>
    /// <param name="elevation">Elevation model</param>
    /// <param name="cache">Tile cache instance</param>
    public ElevationController(ILogger<ElevationController> logger, IElevationModel elevation, TileCache cache) {
        this._logger = logger;
        this._elevation = elevation;
        this._cache = cache;
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

        var tiff = _cache.GetTile(bbox, resolution);
        return File(tiff, "image/tiff");
    }

    private BadRequestObjectResult badRequest(string code, string msg)
    {
        return BadRequest(new
        {
            code,
            msg
        });
    }
}