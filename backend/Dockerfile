# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and all source files
COPY InteractHub.sln .
COPY backend/ ./backend/

# Restore dependencies using solution file
RUN dotnet restore InteractHub.sln

# Build and publish API project
WORKDIR /src/backend/src/API
RUN dotnet publish -c Release -o /app/publish

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
