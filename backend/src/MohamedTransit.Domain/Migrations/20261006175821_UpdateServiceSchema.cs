using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MohamedTransit.Domain.Migrations
{
    /// <inheritdoc />
    public partial class UpdateServiceSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Status",
                table: "Services",
                newName: "Reference");

            migrationBuilder.RenameColumn(
                name: "ServiceName",
                table: "Services",
                newName: "Phone");

            migrationBuilder.RenameColumn(
                name: "Fee",
                table: "Services",
                newName: "Notes");

            migrationBuilder.RenameColumn(
                name: "Description",
                table: "Services",
                newName: "Email");

            migrationBuilder.AddColumn<string>(
                name: "ContactPerson",
                table: "Services",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<long>(
                name: "ImporterId",
                table: "Services",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0L);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ContactPerson",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "ImporterId",
                table: "Services");

            migrationBuilder.RenameColumn(
                name: "Reference",
                table: "Services",
                newName: "Status");

            migrationBuilder.RenameColumn(
                name: "Phone",
                table: "Services",
                newName: "ServiceName");

            migrationBuilder.RenameColumn(
                name: "Notes",
                table: "Services",
                newName: "Fee");

            migrationBuilder.RenameColumn(
                name: "Email",
                table: "Services",
                newName: "Description");
        }
    }
}
