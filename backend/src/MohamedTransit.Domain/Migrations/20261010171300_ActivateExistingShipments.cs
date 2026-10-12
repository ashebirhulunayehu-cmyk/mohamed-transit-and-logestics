using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using MohamedTransit.Domain.Data;

#nullable disable

namespace MohamedTransit.Domain.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20261010171300_ActivateExistingShipments")]
public partial class ActivateExistingShipments : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """UPDATE "Shipments" SET "RecordStatus" = 2 WHERE "RecordStatus" = 0""");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Existing rows cannot be safely restored to their previous status after the backfill.
    }
}
