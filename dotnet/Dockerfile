# Use the official .NET SDK image as the build environment
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build-env
WORKDIR /app

# Copy the CSPROJ files and restore dependencies
COPY ElevationApi/*.csproj ./ElevationApi/
COPY Nitro/*.csproj ./Nitro/
RUN dotnet restore ./ElevationApi/ElevationApi.csproj

# Copy the rest of the code and build the application
COPY ElevationApi/ ./ElevationApi/
COPY Nitro/ ./Nitro/
RUN dotnet publish ./ElevationApi/ElevationApi.csproj -c Release -o out

# Use the official .NET Runtime image as the runtime environment
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build-env /app/out .

# Start the application
ENTRYPOINT ["./ElevationApi"]