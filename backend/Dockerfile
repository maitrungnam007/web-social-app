# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files
COPY ["src/API/API.csproj", "src/API/"]
COPY ["src/Core/Core.csproj", "src/Core/"]
COPY ["src/Infrastructure/Infrastructure.csproj", "src/Infrastructure/"]

# Restore dependencies
RUN dotnet restore "src/API/API.csproj"

# Copy all source code
COPY . .

# Build and publish
WORKDIR "/src/src/API"
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
