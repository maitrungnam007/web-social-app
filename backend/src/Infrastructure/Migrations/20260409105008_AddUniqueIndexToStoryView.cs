using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueIndexToStoryView : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Xoa duplicate records, giu lai record co Id nho nhat
            migrationBuilder.Sql(@"
                DELETE FROM StoryViews
                WHERE Id NOT IN (
                    SELECT MIN(Id)
                    FROM StoryViews
                    GROUP BY StoryId, ViewerId
                )
            ");

            migrationBuilder.DropIndex(
                name: "IX_StoryViews_StoryId",
                table: "StoryViews");

            migrationBuilder.CreateIndex(
                name: "IX_StoryViews_StoryId_ViewerId",
                table: "StoryViews",
                columns: new[] { "StoryId", "ViewerId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_StoryViews_StoryId_ViewerId",
                table: "StoryViews");

            migrationBuilder.CreateIndex(
                name: "IX_StoryViews_StoryId",
                table: "StoryViews",
                column: "StoryId");
        }
    }
}
