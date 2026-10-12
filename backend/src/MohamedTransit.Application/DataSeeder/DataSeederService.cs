using Microsoft.EntityFrameworkCore;
using MohamedTransit.Application.Service;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;
namespace MohamedTransit.Application.DataSeeder;
public interface IDataSeederService
{
    Task SeedAsync();
}

public class DataSeederService : IDataSeederService
{
    private readonly ApplicationDbContext _context;
    private readonly PasswordService _passwordService;

    public DataSeederService(ApplicationDbContext context, PasswordService passwordService)
    {
        _context = context;
        _passwordService = passwordService;
    }

    public async Task SeedAsync()
    {
        // 1. Seed privileges and save
        await SeedPrivilegesAsync();
        await _context.SaveChangesAsync();

        // 2. Seed roles and save (ይህ በጣም ወሳኝ ነው!)
        await SeedRolesAsync();
        await _context.SaveChangesAsync();

        // 3. Seed users and save
        await SeedUsersAsync();
        await _context.SaveChangesAsync();

        // 4. Assign privileges to roles and save
        await AssignPrivilegesToRolesAsync();
        await _context.SaveChangesAsync();

        // 5. Assign roles to users and save
        await AssignRolesToUsersAsync();
        await _context.SaveChangesAsync();

        // 6. Seed development-only records for the Data Encoder dashboard
        await SeedDataEncoderDashboardRecordsAsync();
    }

    private async Task SeedPrivilegesAsync()
    {
        var privileges = new List<Privilege>
        {
            // Existing System Privileges
            Privilege.Create("User-Create", "Create new users"),
            Privilege.Create("User-Update", "Update user information"),
            Privilege.Create("User-Delete", "Delete users"),
            Privilege.Create("User-GetAll", "View all users"),
            Privilege.Create("User-GetById", "View user details"),
            Privilege.Create("User-Logout", "User logout"),

            Privilege.Create("Roles-Create", "Create new roles"),
            Privilege.Create("Roles-Update", "Update role information"),
            Privilege.Create("Roles-Delete", "Delete roles"),
            Privilege.Create("Roles-GetAll", "View all roles"),
            Privilege.Create("Role-GetById", "View role details"),

            Privilege.Create("Privilege-Create", "Create new privileges"),
            Privilege.Create("Privilege-Update", "Update privilege information"),
            Privilege.Create("Privilege-Delete", "Delete privileges"),
            Privilege.Create("Privilege-GetAll", "View all privileges"),

            // MOT Service Management Privileges
            Privilege.Create("Service-Create", "Create new services"),
            Privilege.Create("Service-Update", "Update service information"),
            Privilege.Create("Service-Delete", "Delete services"),
            Privilege.Create("Service-GetAll", "View all services"),
            Privilege.Create("Service-GetById", "View service details"),
            Privilege.Create("Service-UpdateStatus", "Update service status"),
            Privilege.Create("Service-Assign", "Assign services to users"),

            // MOT Customer Management Privileges
            Privilege.Create("Customer-Create", "Create new customers"),
            Privilege.Create("Customer-Update", "Update customer information"),
            Privilege.Create("Customer-Delete", "Delete customers"),
            Privilege.Create("Customer-GetAll", "View all customers"),
            Privilege.Create("Customer-GetById", "View customer details"),
            Privilege.Create("Customer-Approve", "Approve customer registrations"),
            Privilege.Create("Customer-CreateServiceRequest", "Create service requests"),

            // Document Management Privileges
            Privilege.Create("Document-Upload", "Upload documents"),
            Privilege.Create("Document-Download", "Download documents"),
            Privilege.Create("Document-Verify", "Verify documents"),
            Privilege.Create("Document-Delete", "Delete documents"),
            Privilege.Create("Document-GetAll", "View all documents"),

            // Messaging Privileges
            Privilege.Create("Message-Send", "Send messages"),
            Privilege.Create("Message-GetAll", "View all messages"),
            Privilege.Create("Message-GetById", "View message details"),

            // Notification Privileges
            Privilege.Create("Notification-Create", "Create notifications"),
            Privilege.Create("Notification-GetAll", "View all notifications"),
            Privilege.Create("Notification-MarkAsRead", "Mark notifications as read"),

            // Reporting Privileges
            Privilege.Create("Report-GetAll", "View all reports"),
            Privilege.Create("Report-Export", "Export reports"),

            // Dashboard Privileges
            Privilege.Create("Dashboard-View", "View dashboard"),
            Privilege.Create("Dashboard-Manager", "View manager dashboard"),
            Privilege.Create("Dashboard-Assessor", "View assessor dashboard"),
            Privilege.Create("Dashboard-CaseExecutor", "View case executor dashboard"),
            Privilege.Create("Dashboard-DataEncoder", "View data encoder dashboard"),
            Privilege.Create("Dashboard-GetAdminDashboardDataQuery", "Get admin dashboard data"),
            Privilege.Create("Dashboard-GetAdminDashboardDataSortQuery", "Get admin dashboard data with sorting"),
            Privilege.Create("Dashboard-GetOrganizationDashboardData", "Get organization dashboard data"),
            Privilege.Create("Dashboard-GetOrganizationDashboardDataSortQuery", "Get organization dashboard data with sorting"),
        };

        var existingActions = (await _context.Privileges
                .Select(privilege => privilege.Action)
                .ToListAsync())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        _context.Privileges.AddRange(
            privileges.Where(privilege => existingActions.Add(privilege.Action)));
    }

    private async Task SeedRolesAsync()
    {
        var roles = new List<Role>
        {
            Role.Create("SuperAdmin", "Super Administrator with full system access"),
            Role.Create("Manager", "Manager with oversight and management capabilities"),
            Role.Create("Assessor", "Assessor responsible for customer verification and approval"),
            Role.Create("CaseExecutor", "Case Executor responsible for service execution"),
            Role.Create("DataEncoder", "Data Encoder responsible for data entry and service creation"),
            Role.Create("Customer", "Customer role for external users"),
        };

        var existingNames = (await _context.Roles
                .Select(role => role.Name)
                .ToListAsync())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        _context.Roles.AddRange(
            roles.Where(role => existingNames.Add(role.Name)));
    }

    private async Task SeedUsersAsync()
    {
        var users = new List<User>
        {
            // Super Admin
            User.CreateUser(
                "superadmin",
                "superadmin@Mohamedtransit.com",
                "Super",
                "Admin",
                "",
                "+1234567890",
                _passwordService.HashPassword("Admin123!"),
                true,
                AccountStatus.Approved
            ),

            // Manager
            User.CreateUser(
                "manager",
                "manager@Mohamedtransit.com",
                "Nadiya",
                "Manager",
                "",
                "+1234567891",
                _passwordService.HashPassword("Manager123!"),
                false,
                AccountStatus.Approved
            ),

            // Assessor
            User.CreateUser(
                "assessor",
                "assessor@Mohamedtransit.com",
                "Hulu",
                "Assessor",
                "",
                "+1234567892",
                _passwordService.HashPassword("Assessor123!"),
                false,
                AccountStatus.Approved
            ),

            // Case Executor
            User.CreateUser(
                "caseexecutor",
                "caseexecutor@Mohamedtransit.com",
                "Nebil",
                "Executor",
                "",
                "+1234567893",
                _passwordService.HashPassword("Executor123!"),
                false,
                AccountStatus.Approved
            ),

            // Data Encoder
            User.CreateUser(
                "dataencoder",
                "dataencoder@Mohamedtransit.com",
                "Selam",
                "Encoder",
                "",
                "+1234567894",
                _passwordService.HashPassword("Encoder123!"),
                false,
                AccountStatus.Approved
            ),

            // Customer
            User.CreateUser(
                "customer",
                "customer@Mohamedtransit.com",
                "Customer",
                "User",
                "",
                "+1234567895",
                _passwordService.HashPassword("Customer123!"),
                false,
                AccountStatus.Approved
            ),

            // Development-only importer used by the encoder dashboard sample records
            User.CreateUser(
                "encoder-demo-importer",
                "encoder-demo-importer@example.invalid",
                "Development",
                "Importer",
                "",
                "+0000000000",
                _passwordService.HashPassword(Guid.NewGuid().ToString("N")),
                false,
                AccountStatus.Approved
            ),
        };

        var existingUsers = await _context.Users
            .Select(user => new { user.Username, user.Email })
            .ToListAsync();
        var existingUsernames = existingUsers
            .Select(user => user.Username)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        var existingEmails = existingUsers
            .Select(user => user.Email)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        _context.Users.AddRange(users.Where(user =>
            existingUsernames.Add(user.Username) &&
            existingEmails.Add(user.Email)));
    }

    private async Task AssignPrivilegesToRolesAsync()
    {
        var roles = await _context.Roles.ToDictionaryAsync(role => role.Name);
        var allPrivileges = await _context.Privileges.ToListAsync();
        var existingAssignments = (await _context.RolePrivileges
                .Select(assignment => new { assignment.RoleId, assignment.PrivilegeId })
                .ToListAsync())
            .Select(assignment => (assignment.RoleId, assignment.PrivilegeId))
            .ToHashSet();
        var rolePrivileges = new List<RolePrivilege>();

        void AddAssignments(string roleName, Func<string, bool> hasPrivilege)
        {
            if (!roles.TryGetValue(roleName, out var role))
            {
                return;
            }

            foreach (var privilege in allPrivileges.Where(privilege => hasPrivilege(privilege.Action)))
            {
                if (existingAssignments.Add((role.Id, privilege.Id)))
                {
                    rolePrivileges.Add(RolePrivilege.Create(role.Id, privilege.Id));
                }
            }
        }

        AddAssignments("SuperAdmin", _ => true);
        AddAssignments("Manager", action =>
            action.Contains("Service-") ||
            action.Contains("Customer-") ||
            action.Contains("Document-") ||
            action.Contains("Message-") ||
            action.Contains("Notification-") ||
            action.Contains("Report-") ||
            action.Contains("Dashboard-") ||
            action.Contains("User-GetAll") ||
            action.Contains("Role-GetAll"));
        AddAssignments("Assessor", action =>
            action.Contains("Customer-Approve") ||
            action.Contains("Customer-GetAll") ||
            action.Contains("Customer-GetById") ||
            action.Contains("Document-Verify") ||
            action.Contains("Document-GetAll") ||
            action.Contains("Message-") ||
            action.Contains("Notification-") ||
            action.Contains("Dashboard-Assessor"));
        AddAssignments("CaseExecutor", action =>
            action.Contains("Service-Update") ||
            action.Contains("Service-UpdateStatus") ||
            action.Contains("Service-GetAll") ||
            action.Contains("Service-GetById") ||
            action.Contains("Document-Upload") ||
            action.Contains("Document-Download") ||
            action.Contains("Document-GetAll") ||
            action.Contains("Message-") ||
            action.Contains("Notification-") ||
            action.Contains("Dashboard-CaseExecutor"));
        AddAssignments("DataEncoder", action =>
            action.Contains("Service-Create") ||
            action.Contains("Service-GetAll") ||
            action.Contains("Service-GetById") ||
            action.Contains("Customer-Create") ||
            action.Contains("Customer-GetAll") ||
            action.Contains("Customer-GetById") ||
            action.Contains("Document-Upload") ||
            action.Contains("Document-GetAll") ||
            action.Contains("Message-") ||
            action.Contains("Notification-") ||
            action.Contains("Dashboard-DataEncoder"));
        AddAssignments("Customer", action =>
            action.Contains("Service-GetById") ||
            action.Contains("Customer-GetById") ||
            action.Contains("Customer-CreateServiceRequest") ||
            action.Contains("Document-Download") ||
            action.Contains("Message-Send") ||
            action.Contains("Message-GetAll") ||
            action.Contains("Notification-GetAll"));

        _context.RolePrivileges.AddRange(rolePrivileges);
    }

    private async Task AssignRolesToUsersAsync()
    {
        var roles = await _context.Roles.ToDictionaryAsync(role => role.Name);
        var users = await _context.Users.ToDictionaryAsync(user => user.Username);
        var existingAssignments = (await _context.UserRoles
                .Select(assignment => new { assignment.UserId, assignment.RoleId })
                .ToListAsync())
            .Select(assignment => (assignment.UserId, assignment.RoleId))
            .ToHashSet();
        var userRoles = new List<UserRole>();
        var roleAssignments = new[]
        {
            ("superadmin", "SuperAdmin"),
            ("manager", "Manager"),
            ("assessor", "Assessor"),
            ("caseexecutor", "CaseExecutor"),
            ("dataencoder", "DataEncoder"),
            ("customer", "Customer"),
            ("encoder-demo-importer", "Customer")
        };

        foreach (var (username, roleName) in roleAssignments)
        {
            if (users.TryGetValue(username, out var user) &&
                roles.TryGetValue(roleName, out var role) &&
                existingAssignments.Add((user.Id, role.Id)))
            {
                userRoles.Add(UserRole.Create(user.Id, role.Id));
            }
        }
 
        _context.UserRoles.AddRange(userRoles);
    }

    private async Task SeedDataEncoderDashboardRecordsAsync()
    {
        var dataEncoder = await _context.Users
            .FirstOrDefaultAsync(user => user.Username == "dataencoder");
        var demoImporter = await _context.Users
            .FirstOrDefaultAsync(user => user.Username == "encoder-demo-importer");

        if (dataEncoder == null || demoImporter == null)
        {
            return;
        }

        const string demoTin = "DEV-ENCODER-TEST-001";
        var customer = await _context.Customers
            .FirstOrDefaultAsync(record => record.TINNumber == demoTin);

        if (customer == null)
        {
            customer = Customer.Create(
                "Development Demo Importer",
                demoTin,
                "DEV-LICENSE-001",
                "Development test record",
                "Addis Ababa",
                "Addis Ababa",
                "0000",
                "Development Importer",
                "+0000000000",
                "encoder-demo-importer@example.invalid",
                "Development test data",
                "DEV-IMPORT-LICENSE-001",
                null,
                demoImporter.Id,
                dataEncoder.Id);

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();
        }

        const string trackingNumber = "MT-DEV-ENCODER-SAMPLE-001";
        var serviceExists = await _context.Shipments
            .AnyAsync(shipment => shipment.TrackingNumber == trackingNumber);
        if (serviceExists)
        {
            return;
        }

        var service = Shipment.Create(
            trackingNumber,
            "Development dashboard sample shipment",
            demoImporter.Id,
            "Development dashboard sample shipment",
            TransportMode.MultiModalSeaRail,
            HubLocation.Mojo,
            "Development origin",
            "Mojo",
            dataEncoder.Id);
        service.UpdateServiceType(ServiceType.Multimodal);
        service.UpdateDetails(
            "Development dashboard sample shipment",
            "Mojo",
            1000m,
            "Development sample",
            "Development origin",
            null);
        service.SetCreatedByDataEncoder(dataEncoder.Id);

        _context.Shipments.Add(service);
        await _context.SaveChangesAsync();
    }
}
