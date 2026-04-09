# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files
COPY ["backend/src/API/API.csproj", "backend/src/API/"]
COPY ["backend/src/Core/Core.csproj", "backend/src/Core/"]
COPY ["backend/src/Infrastructure/Infrastructure.csproj", "backend/src/Infrastructure/"]

# Restore dependencies
RUN dotnet restore "backend/src/API/API.csproj"

# Copy all source code
COPY backend/ .

# Build and publish
WORKDIR "/src/backend/src/API"
RUN dotnet publish "API.csproj" -c Release -o /app/publish --no-restore

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Copy published app
COPY --from=build /app/publish .

# Set environment
ENV ASPNETCORE_URLS=http://+:10000
ENV ASPNETCORE_ENVIRONMENT=Production

# Expose port
EXPOSE 10000

# Start the app
ENTRYPOINT ["dotnet", "API.dll"]
