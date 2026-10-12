using Microsoft.EntityFrameworkCore;

using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.Domain.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }
    public DbSet<StageDocument> StageDocuments => Set<StageDocument>();
    // ==========================================
    // Shipment & Stage Modules
    // ==========================================

    public DbSet<Shipment> Shipments => Set<Shipment>();

    public DbSet<ServiceStageExecution> ServiceStageExecutions => Set<ServiceStageExecution>();

    public DbSet<ServiceStageExecution> Stages => Set<ServiceStageExecution>();
    // Add these missing ones to fix your controller errors:
    public DbSet<ServiceStageExecution> ShipmentStages => Set<ServiceStageExecution>();
    public DbSet<ServiceStageExecution> ShipmentStage => Set<ServiceStageExecution>();
    public DbSet<Service> Services { get; set; } = null!;
    public DbSet<StageComment> StageComments => Set<StageComment>();
    public DbSet<Notification> Notifications => Set<Notification>();
 public DbSet<StageTransport> Transports { get; set; }
    // ==========================================
    // User Account Module
    // ==========================================

    public DbSet<User> Users => Set<User>();

    public DbSet<Role> Roles => Set<Role>();

    public DbSet<Privilege> Privileges => Set<Privilege>();

    public DbSet<UserRole> UserRoles => Set<UserRole>();

    public DbSet<RolePrivilege> RolePrivileges => Set<RolePrivilege>();
    public DbSet<ServiceDocument> ServiceDocuments { get; set; }
    public DbSet<Customer> Customers { get; set; }
    public DbSet<CustomerDocument> CustomerDocuments { get; set; }
    public DbSet<ServiceMessage> ServiceMessages { get; set; }
    
   
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Automatically load IEntityTypeConfiguration<T>
        // classes from the Domain assembly.
        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(ApplicationDbContext).Assembly);

        modelBuilder.Entity<Shipment>()
    .HasOne(s => s.Importer)
    .WithMany() // ወይም .WithMany(u => u.Shipments)
    .HasForeignKey(s => s.ImporterId)
    .OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<Shipment>()
    .Property(s => s.DeclaredValue)
    .HasColumnType("decimal(18,2)");
        // ==========================================
        // UserRole
        // ==========================================

        modelBuilder.Entity<UserRole>()
            .HasKey(x => x.Id);

        modelBuilder.Entity<UserRole>()
            .HasOne(x => x.User)
            .WithMany(x => x.UserRoles)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<UserRole>()
            .HasOne(x => x.Role)
            .WithMany(x => x.UserRoles)
            .HasForeignKey(x => x.RoleId)
            .OnDelete(DeleteBehavior.Cascade);


        // ==========================================
        // RolePrivilege
        // ==========================================

        modelBuilder.Entity<RolePrivilege>()
            .HasKey(x => x.Id);

        modelBuilder.Entity<RolePrivilege>()
            .HasOne(x => x.Role)
            .WithMany(x => x.RolePrivileges)
            .HasForeignKey(x => x.RoleId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<RolePrivilege>()
            .HasOne(x => x.Privilege)
            .WithMany()
            .HasForeignKey(x => x.PrivilegeId)
            .OnDelete(DeleteBehavior.Restrict);
}
}
