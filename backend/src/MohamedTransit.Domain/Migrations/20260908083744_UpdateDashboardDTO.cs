using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MohamedTransit.Domain.Migrations
{
    /// <inheritdoc />
    public partial class UpdateDashboardDTO : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StageComment_ServiceStageExecution_ServiceStageId",
                table: "StageComment");

            migrationBuilder.DropForeignKey(
                name: "FK_StageComment_Users_CommentedByUserId",
                table: "StageComment");

            migrationBuilder.DropPrimaryKey(
                name: "PK_StageComment",
                table: "StageComment");

            migrationBuilder.RenameTable(
                name: "StageComment",
                newName: "StageComments");

            migrationBuilder.RenameIndex(
                name: "IX_StageComment_ServiceStageId",
                table: "StageComments",
                newName: "IX_StageComments_ServiceStageId");

            migrationBuilder.RenameIndex(
                name: "IX_StageComment_CommentedByUserId",
                table: "StageComments",
                newName: "IX_StageComments_CommentedByUserId");

            migrationBuilder.AddColumn<long>(
                name: "CreatedByDataEncoderId",
                table: "Shipments",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedDate",
                table: "ServiceMessages",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddPrimaryKey(
                name: "PK_StageComments",
                table: "StageComments",
                column: "Id");

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Title = table.Column<string>(type: "TEXT", nullable: false),
                    Message = table.Column<string>(type: "TEXT", nullable: false),
                    Type = table.Column<int>(type: "INTEGER", nullable: false),
                    IsRead = table.Column<bool>(type: "INTEGER", nullable: false),
                    ReadAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    IsSent = table.Column<bool>(type: "INTEGER", nullable: false),
                    SentAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ActionUrl = table.Column<string>(type: "TEXT", nullable: true),
                    ActionText = table.Column<string>(type: "TEXT", nullable: true),
                    IsUrgent = table.Column<bool>(type: "INTEGER", nullable: false),
                    UserId = table.Column<long>(type: "INTEGER", nullable: true),
                    ServiceId = table.Column<long>(type: "INTEGER", nullable: true),
                    ServiceStageId = table.Column<long>(type: "INTEGER", nullable: true),
                    ShipmentId = table.Column<long>(type: "INTEGER", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreateAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    RecordStatus = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Notifications_ServiceStageExecution_ServiceStageId",
                        column: x => x.ServiceStageId,
                        principalTable: "ServiceStageExecution",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Notifications_Shipments_ShipmentId",
                        column: x => x.ShipmentId,
                        principalTable: "Shipments",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Notifications_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_CreatedByDataEncoderId",
                table: "Shipments",
                column: "CreatedByDataEncoderId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_ServiceStageId",
                table: "Notifications",
                column: "ServiceStageId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_ShipmentId",
                table: "Notifications",
                column: "ShipmentId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_UserId",
                table: "Notifications",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Shipments_Users_CreatedByDataEncoderId",
                table: "Shipments",
                column: "CreatedByDataEncoderId",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_StageComments_ServiceStageExecution_ServiceStageId",
                table: "StageComments",
                column: "ServiceStageId",
                principalTable: "ServiceStageExecution",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_StageComments_Users_CommentedByUserId",
                table: "StageComments",
                column: "CommentedByUserId",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Shipments_Users_CreatedByDataEncoderId",
                table: "Shipments");

            migrationBuilder.DropForeignKey(
                name: "FK_StageComments_ServiceStageExecution_ServiceStageId",
                table: "StageComments");

            migrationBuilder.DropForeignKey(
                name: "FK_StageComments_Users_CommentedByUserId",
                table: "StageComments");

            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropIndex(
                name: "IX_Shipments_CreatedByDataEncoderId",
                table: "Shipments");

            migrationBuilder.DropPrimaryKey(
                name: "PK_StageComments",
                table: "StageComments");

            migrationBuilder.DropColumn(
                name: "CreatedByDataEncoderId",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "CreatedDate",
                table: "ServiceMessages");

            migrationBuilder.RenameTable(
                name: "StageComments",
                newName: "StageComment");

            migrationBuilder.RenameIndex(
                name: "IX_StageComments_ServiceStageId",
                table: "StageComment",
                newName: "IX_StageComment_ServiceStageId");

            migrationBuilder.RenameIndex(
                name: "IX_StageComments_CommentedByUserId",
                table: "StageComment",
                newName: "IX_StageComment_CommentedByUserId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_StageComment",
                table: "StageComment",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_StageComment_ServiceStageExecution_ServiceStageId",
                table: "StageComment",
                column: "ServiceStageId",
                principalTable: "ServiceStageExecution",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_StageComment_Users_CommentedByUserId",
                table: "StageComment",
                column: "CommentedByUserId",
                principalTable: "Users",
                principalColumn: "Id");
        }
    }
}
