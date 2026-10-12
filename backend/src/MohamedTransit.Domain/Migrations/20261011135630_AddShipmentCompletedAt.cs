using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MohamedTransit.Domain.Migrations;

public partial class AddShipmentCompletedAt : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<DateTime>(
            name: "CompletedAt",
            table: "Shipments",
            type: "TEXT",
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "CompletedAt",
            table: "Shipments");
    }
}
