using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

using MohamedTransit.Domain.Entities;

namespace MohamedTransit.Domain.Configurations;

public class ShipmentConfiguration : IEntityTypeConfiguration<Shipment>
{
    public void Configure(EntityTypeBuilder<Shipment> builder)
    {
        // Primary Key
        builder.HasKey(s => s.Id);

        // Tracking Number
        builder.Property(s => s.TrackingNumber)
            .IsRequired()
            .HasMaxLength(50);

        // Importer Relationship (ይህ ክፍል ተስተካክሏል)
        builder.Property(s => s.ImporterId)
            .IsRequired();

        builder.HasOne(s => s.Importer)
            .WithMany()
            .HasForeignKey(s => s.ImporterId)
            .OnDelete(DeleteBehavior.Restrict);

        // Declared Value Precision (ይህም ተጨምሯል)
        builder.Property(s => s.DeclaredValue)
            .HasColumnType("decimal(18,2)");

        // Description
        builder.Property(s => s.Description)
            .HasMaxLength(500);

        // Origin
        builder.Property(s => s.Origin)
            .IsRequired()
            .HasMaxLength(100);

        // Destination
        builder.Property(s => s.Destination)
            .IsRequired()
            .HasMaxLength(100);

        // Enum Conversion
        builder.Property(s => s.Mode)
            .HasConversion<string>();

        builder.Property(s => s.Status)
            .HasConversion<string>();

        builder.Property(s => s.CompletedAt)
            .IsRequired(false);

        builder.Property(s => s.AssignedHub)
            .HasConversion<string>();
    }
}
