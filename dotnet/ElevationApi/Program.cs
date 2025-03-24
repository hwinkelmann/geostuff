using ElevationApi.Dem;

// Read configration from environment variables
var dataFolder = Environment.GetEnvironmentVariable("DEM_DATA") ?? @"C:\data\geo\ASTER";
var cacheFolder = Environment.GetEnvironmentVariable("CACHE_FOLDER") ?? @"c:\temp\tiles";
var port = int.Parse(Environment.GetEnvironmentVariable("PORT") ?? "3001");

var elevationModel = new AsterElevationModel(dataFolder);

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddScoped<IElevationModel>((provider) =>
{
    return elevationModel;
});

builder.Services.AddScoped((provider) =>
{
    return new TileCache(cacheFolder, elevationModel);
});

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
// swagger/v1/swagger.json
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options => {
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo {
        Title = "Elevation API",
        Description = "API for retrieving elevation from a Digital Elevation Model (DEM)",
        Version = "v1",
    });
});

// Configure Kestrel to listen on a specific port
builder.WebHost.UseKestrel(options =>
{
    options.ListenAnyIP(port);
});

var app = builder.Build();
app.UsePathBase("/api");

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger(options => {
        options.RouteTemplate = "docs/{documentName}/openapi.json";
    });

    app.UseSwaggerUI(options => {
        options.RoutePrefix = "docs";
        options.SwaggerEndpoint("/api/docs/v1/openapi.json", "My API V1");
    });
}

//app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
