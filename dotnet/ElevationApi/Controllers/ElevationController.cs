using ElevationApi.Dem;
using Microsoft.AspNetCore.Mvc;
using Nitro.Geography;
using NitroGis.Geography.Mapping;

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
    public async Task<IActionResult> GetAt([FromQuery] double latitude, [FromQuery] double longitude) {
        return Ok(new Coordinate(latitude, longitude, await _elevation.GetElevation(latitude, longitude)));
    }

    /// <summary>
    /// Returns a tile, identified by it's address
    /// </summary>
    /// <param name="x">x</param>
    /// <param name="y">y</param>
    /// <param name="z">zoom</param>
    /// <param name="resolution">resolution of the tile, defaults to 256</param>
    /// <returns>tiff</returns>
    [HttpGet]

    // Add route for the /elevation/z/x/y endpoint
    [Route("tile/{z}/{x}/{y}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTile([FromRoute]int x, [FromRoute] int y, [FromRoute] int z, [FromQuery]int resolution = 256)
    {
        var desc = new TileDescriptor(x, y, Math.Max(0, Math.Min(18, z)));
        if (x < 0 || y < 0 || z < 0 || x >= desc.TilesWidth || y >= desc.TilesWidth)
            return badRequest("INVALID_TILE_ADDRESS", "Tile address is invalid");

        Response.Headers.Append("Content-Encoding", "gzip");

        // Enable client side caching
        Response.Headers.Append("Cache-Control", "public, max-age=31536000");

        return File(await _cache.GetTile(desc, resolution), "application/gzip");

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