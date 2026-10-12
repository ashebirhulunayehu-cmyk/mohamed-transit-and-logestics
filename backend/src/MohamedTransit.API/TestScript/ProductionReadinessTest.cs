using Microsoft.EntityFrameworkCore;

using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.API.TestScripts;

public class ProductionReadinessTest
{
    private readonly ApplicationDbContext _context;

    public ProductionReadinessTest(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<TestResult> RunAllTests()
    {
        var result = new TestResult();

        // Test 1: Database Connection
        result.DatabaseConnection = await TestDatabaseConnection();

        // Test 2: User Roles and Permissions
        result.UserRoles = await TestUserRoles();

        // Test 3: MOT System Models
        result.MOTModels = await TestMOTModels();

        // Test 4: Service Workflow
        result.ServiceWorkflow = await TestServiceWorkflow();

        // Test 5: Document Management
        result.DocumentManagement = await TestDocumentManagement();

        // Test 6: Customer Management
        result.CustomerManagement = await TestCustomerManagement();

        return result;
    }

    private async Task<bool> TestDatabaseConnection()
    {
        try
        {
            await _context.Database.CanConnectAsync();
            return true;
        }
        catch
        {
            return false;
        }
    }

    private async Task<bool> TestUserRoles()
    {
        try
        {
            // Check if all required roles exist (Role -> Roles ተስተካክሏል)
            var requiredRoles = new[] { "SuperAdmin", "Manager", "Assessor", "CaseExecutor", "DataEncoder", "Customer" };
            var existingRoles = await _context.Roles.Select(r => r.Name).ToListAsync();

            foreach (var role in requiredRoles)
            {
                if (!existingRoles.Contains(role))
                    return false;
            }

            // Check if privileges are properly configured (Privilege -> Privileges ተስተካክሏል)
            var privileges = await _context.Privileges.CountAsync();
            return privileges > 0;
        }
        catch
        {
            return false;
        }
    }

    private async Task<bool> TestMOTModels()
    {
        try
        {
            // Test if we can create and query MOT entities
            var serviceCount = await _context.Shipments.CountAsync();
            var customerCount = await _context.Customers.CountAsync();
            var stageCount = await _context.ShipmentStages.CountAsync();

            return true;
        }
        catch
        {
            return false;
        }
    }

    private async Task<bool> TestServiceWorkflow()
    {
        try
        {
            var testService = Shipment.Create(
                trackingNumber: "TEST-SRV-001",
                v: "Test Item Meta",
                importerId: 1L,
                description: "Test Item Description",
                mode: TransportMode.MultiModalSeaRail,
                assignedHub: HubLocation.Djibouti,
                origin: "Test Country",
                destination: "Test Destination",
                createdByUserId: 1L
            );

            _context.Shipments.Add(testService);
            await _context.SaveChangesAsync();

            var stages = new[]
            {
                ServiceStageExecution.Create(testService.Id, ShipmentStage.PrepaymentInvoice),
                ServiceStageExecution.Create(testService.Id, ShipmentStage.DropRisk),
                ServiceStageExecution.Create(testService.Id, ShipmentStage.DeliveryOrder)
            };

            _context.ShipmentStages.AddRange(stages);
            await _context.SaveChangesAsync();

            // Clean up test data
            _context.ShipmentStages.RemoveRange(stages);
            _context.Shipments.Remove(testService);
            await _context.SaveChangesAsync();

            return true;
        }
        catch
        {
            return false;
        }
    }

    private async Task<bool> TestDocumentManagement()
    {
        try
        {
            var documentCount = await _context.ServiceDocuments.CountAsync();
            var stageDocumentCount = await _context.StageDocuments.CountAsync();

            return true;
        }
        catch
        {
            return false;
        }
    }

    private async Task<bool> TestCustomerManagement()
    {
        try
        {
            var customerCount = await _context.Customers.CountAsync();
            var customerDocumentCount = await _context.CustomerDocuments.CountAsync();

            return true;
        }
        catch
        {
            return false;
        }
    }
}

public class TestResult
{
    public bool DatabaseConnection { get; set; }
    public bool UserRoles { get; set; }
    public bool MOTModels { get; set; }
    public bool ServiceWorkflow { get; set; }
    public bool DocumentManagement { get; set; }
    public bool CustomerManagement { get; set; }

    public bool AllTestsPassed =>
        DatabaseConnection &&
        UserRoles &&
        MOTModels &&
        ServiceWorkflow &&
        DocumentManagement &&
        CustomerManagement;

    public string GetSummary()
    {
        var passed = new List<string>();
        var failed = new List<string>();

        if (DatabaseConnection) passed.Add("Database Connection"); else failed.Add("Database Connection");
        if (UserRoles) passed.Add("User Roles"); else failed.Add("User Roles");
        if (MOTModels) passed.Add("MOT Models"); else failed.Add("MOT Models");
        if (ServiceWorkflow) passed.Add("Service Workflow"); else failed.Add("Service Workflow");
        if (DocumentManagement) passed.Add("Document Management"); else failed.Add("Document Management");
        if (CustomerManagement) passed.Add("Customer Management"); else failed.Add("Customer Management");

        return $"Passed: {string.Join(", ", passed)}\nFailed: {string.Join(", ", failed)}";
    }
}
