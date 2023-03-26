using Microsoft.AspNetCore.Mvc;
using Nitro.Geography;

/// <summary>
/// Elevation Controller
/// </summary>
[ApiController]
[Route("elevation")]
public class ElevationController : ControllerBase {

    private readonly ILogger<ElevationController> _logger;

    /// <summary>
    /// Creates a new controller instance
    /// </summary>
    /// <param name="logger">Logger instance to use</param>
    public ElevationController(ILogger<ElevationController> logger) {
        this._logger = logger;
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
    public IActionResult GetAt([FromQuery]double latitude, [FromQuery]double longitude) {
        return Ok(new Coordinate(52, 8));
    }
}