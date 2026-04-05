using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFriendshipIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Friendships_AddresseeId_Status",
                table: "Friendships",
                columns: new[] { "AddresseeId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_Friendships_RequesterId_Status",
                table: "Friendships",
                columns: new[] { "RequesterId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_Friendships_Status",
                table: "Friendships",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Friendships_AddresseeId_Status",
                table: "Friendships");

            migrationBuilder.DropIndex(
                name: "IX_Friendships_RequesterId_Status",
                table: "Friendships");

            migrationBuilder.DropIndex(
                name: "IX_Friendships_Status",
                table: "Friendships");
        }
    }
}
