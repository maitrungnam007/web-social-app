# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy all backend files first
COPY backend/ ./backend/

# Restore dependencies
WORKDIR /src/backend
RUN dotnet restore

# Build and publish
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
