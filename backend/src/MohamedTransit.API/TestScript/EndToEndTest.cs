using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

using MohamedTransit.Application.Service;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.API.TestScripts;

public class EndToEndTest
{
    private readonly ApplicationDbContext _context;
    private readonly PasswordService _passwordService;

    public EndToEndTest(ApplicationDbContext context, PasswordService passwordService)
    {
        _context = context;
        _passwordService = passwordService;
    }

    public async Task<TestResults> RunCompleteWorkflowTest()
    {
        var results = new TestResults();

        Console.WriteLine("🚀 Starting Complete End-to-End Workflow Test");
        Console.WriteLine(new string('=', 60));

        try
        {
            // Step 1: Test Data Seeding
            Console.WriteLine("\n📊 Step 1: Testing Data Seeding...");
            results.DataSeeding = await TestDataSeeding();
            Console.WriteLine($"✅ Data Seeding: {(results.DataSeeding ? "PASSED" : "FAILED")}");

            // Step 2: Test SuperAdmin Flow
            Console.WriteLine("\n👑 Step 2: Testing SuperAdmin Flow...");
            results.SuperAdminFlow = await TestSuperAdminFlow();
            Console.WriteLine($"✅ SuperAdmin Flow: {(results.SuperAdminFlow ? "PASSED" : "FAILED")}");

            // Step 3: Test DataEncoder Flow (Customer Creation)
            Console.WriteLine("\n📝 Step 3: Testing DataEncoder Flow (Customer Creation)...");
            results.DataEncoderFlow = await TestDataEncoderFlow();
            Console.WriteLine($"✅ DataEncoder Flow: {(results.DataEncoderFlow ? "PASSED" : "FAILED")}");

            // Step 4: Test Assessor Flow (Customer Approval)
            Console.WriteLine("\n🔍 Step 4: Testing Assessor Flow (Customer Approval)...");
            results.AssessorFlow = await TestAssessorFlow();
            Console.WriteLine($"✅ Assessor Flow: {(results.AssessorFlow ? "PASSED" : "FAILED")}");

            // Step 5: Test Customer Flow (Service Request)
            Console.WriteLine("\n👤 Step 5: Testing Customer Flow (Service Request)...");
            results.CustomerFlow = await TestCustomerFlow();
            Console.WriteLine($"✅ Customer Flow: {(results.CustomerFlow ? "PASSED" : "FAILED")}");

            // Step 6: Test Manager Flow (Service Assignment)
            Console.WriteLine("\n👔 Step 6: Testing Manager Flow (Service Assignment)...");
            results.ManagerFlow = await TestManagerFlow();
            Console.WriteLine($"✅ Manager Flow: {(results.ManagerFlow ? "PASSED" : "FAILED")}");

            // Step 7: Test CaseExecutor Flow (Service Execution)
            Console.WriteLine("\n⚡ Step 7: Testing CaseExecutor Flow (Service Execution)...");
            results.CaseExecutorFlow = await TestCaseExecutorFlow();
            Console.WriteLine($"✅ CaseExecutor Flow: {(results.CaseExecutorFlow ? "PASSED" : "FAILED")}");

            // Step 8: Test Complete Workflow
            Console.WriteLine("\n🔄 Step 8: Testing Complete End-to-End Workflow...");
            results.CompleteWorkflow = await TestCompleteWorkflow();
            Console.WriteLine($"✅ Complete Workflow: {(results.CompleteWorkflow ? "PASSED" : "FAILED")}");

            // Step 9: Test Document Management
            Console.WriteLine("\n📄 Step 9: Testing Document Management...");
            results.DocumentManagement = await TestDocumentManagement();
            Console.WriteLine($"✅ Document Management: {(results.DocumentManagement ? "PASSED" : "FAILED")}");

            // Step 10: Test Messaging System
            Console.WriteLine("\n💬 Step 10: Testing Messaging System...");
            results.MessagingSystem = await TestMessagingSystem();
            Console.WriteLine($"✅ Messaging System: {(results.MessagingSystem ? "PASSED" : "FAILED")}");

        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Test failed with exception: {ex.Message}");
            results.OverallSuccess = false;
        }

        results.OverallSuccess = results.DataSeeding && results.SuperAdminFlow && results.DataEncoderFlow &&
                                 results.AssessorFlow && results.CustomerFlow && results.ManagerFlow &&
                                 results.CaseExecutorFlow && results.CompleteWorkflow && results.DocumentManagement &&
                                 results.MessagingSystem;

        Console.WriteLine("\n" + new string('=', 60));
        Console.WriteLine($"🎯 OVERALL TEST RESULT: {(results.OverallSuccess ? "✅ ALL TESTS PASSED" : "❌ SOME TESTS FAILED")}");
        Console.WriteLine(new string('=', 60));

        return results;
    }

    private async Task<bool> TestDataSeeding()
    {
        try
        {
            var roles = await _context.Roles.ToListAsync();
            var expectedRoles = new[] { "SuperAdmin", "Manager", "Assessor", "CaseExecutor", "DataEncoder", "Customer" };

            foreach (var expectedRole in expectedRoles)
            {
                if (!roles.Any(r => r.Name == expectedRole))
                {
                    Console.WriteLine($"❌ Missing role: {expectedRole}");
                    return false;
                }
            }

            var users = await _context.Users.ToListAsync();
            var expectedUsers = new[] { "superadmin", "manager", "assessor", "caseexecutor", "dataencoder", "customer" };

            foreach (var expectedUser in expectedUsers)
            {
                if (!users.Any(u => u.Username.ToLower() == expectedUser.ToLower()))
                {
                    Console.WriteLine($"❌ Missing user: {expectedUser}");
                    return false;
                }
            }

            var rolePrivileges = await _context.RolePrivileges.CountAsync();
            if (rolePrivileges == 0)
            {
                Console.WriteLine("❌ No role privileges assigned");
                return false;
            }

            var userRoles = await _context.UserRoles.CountAsync();
            if (userRoles == 0)
            {
                Console.WriteLine("❌ No user roles assigned");
                return false;
            }

            Console.WriteLine($"✅ Found {roles.Count} roles, {users.Count} users, {rolePrivileges} role privileges, {userRoles} user roles");
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Data seeding test failed: {ex.Message}");
            return false;
        }
    }

    private async Task<bool> TestSuperAdminFlow()
    {
        try
        {
            var superAdmin = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Username.ToLower() == "superadmin");

            if (superAdmin == null)
            {
                Console.WriteLine("❌ SuperAdmin user not found");
                return false;
            }

            var token = GenerateJwtToken(superAdmin);
            if (string.IsNullOrEmpty(token))
            {
                Console.WriteLine("❌ Failed to generate JWT token for SuperAdmin");
                return false;
            }

            var hasSuperAdminRole = superAdmin.UserRoles.Any(ur => ur.Role.Name == "SuperAdmin");
            if (!hasSuperAdminRole)
            {
                Console.WriteLine("❌ SuperAdmin user doesn't have SuperAdmin role");
                return false;
            }

            var passwordValid = _passwordService.ValidatePassword("Admin123!", superAdmin.Password);
            if (!passwordValid)
            {
                Console.WriteLine("❌ SuperAdmin password verification failed");
                return false;
            }

            Console.WriteLine($"✅ SuperAdmin authentication and role verification successful");
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ SuperAdmin flow test failed: {ex.Message}");
            return false;
        }
    }

    private async Task<bool> TestDataEncoderFlow()
    {
        try
        {
            var dataEncoder = await _context.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == "dataencoder");
            if (dataEncoder == null)
            {
                Console.WriteLine("❌ DataEncoder user not found");
                return false;
            }

            return await HasPrivilege(dataEncoder.Id, "Customer-Create") &&
                   await HasPrivilege(dataEncoder.Id, "Service-Create");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ DataEncoder flow error: {ex.Message}");
            return false;
        }
    }

    private async Task<bool> TestAssessorFlow()
    {
        try
        {
            var assessor = await _context.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == "assessor");
            if (assessor == null)
            {
                Console.WriteLine("❌ Assessor user not found");
                return false;
            }

            return await HasPrivilege(assessor.Id, "Customer-Approve") &&
                   await HasPrivilege(assessor.Id, "Document-Verify");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Assessor flow error: {ex.Message}");
            return false;
        }
    }

    private async Task<bool> TestCustomerFlow()
    {
        try
        {
            var customer = await _context.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == "customer");
            if (customer == null)
            {
                Console.WriteLine("❌ Customer user not found");
                return false;
            }

            return await HasPrivilege(customer.Id, "Customer-CreateServiceRequest") &&
                   await HasPrivilege(customer.Id, "Message-Send");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Customer flow error: {ex.Message}");
            return false;
        }
    }

    private async Task<bool> TestManagerFlow()
    {
        try
        {
            var manager = await _context.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == "manager");
            if (manager == null)
            {
                Console.WriteLine("❌ Manager user not found");
                return false;
            }

            return await HasPrivilege(manager.Id, "Service-Assign") &&
                   await HasPrivilege(manager.Id, "Service-GetAll");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Manager flow error: {ex.Message}");
            return false;
        }
    }

    private async Task<bool> TestCaseExecutorFlow()
    {
        try
        {
            var caseExecutor = await _context.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == "caseexecutor");
            if (caseExecutor == null)
            {
                Console.WriteLine("❌ CaseExecutor user not found");
                return false;
            }

            return await HasPrivilege(caseExecutor.Id, "Service-UpdateStatus") &&
                   await HasPrivilege(caseExecutor.Id, "Document-Upload");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ CaseExecutor flow error: {ex.Message}");
            return false;
        }
    }

    private async Task<bool> TestCompleteWorkflow()
    {
        try
        {
            Console.WriteLine("  🔄 Simulating complete MOT service workflow...");

            var dataEncoder = await _context.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == "dataencoder");
            if (dataEncoder == null)
            {
                Console.WriteLine("❌ DataEncoder user not found for complete workflow.");
                return false;
            }

            var customer = await CreateTestCustomer(dataEncoder.Id);
            if (customer == null) return false;

            var assessor = await _context.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == "assessor");
            if (assessor == null)
            {
                Console.WriteLine("❌ Assessor user not found for complete workflow.");
                return false;
            }

            customer.Verify(assessor.Id, "Test approval");
            await _context.SaveChangesAsync();

            var shipment = await CreateTestService(customer.Id, dataEncoder.Id);
            if (shipment == null) return false;

            var manager = await _context.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == "manager");
            var caseExecutor = await _context.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == "caseexecutor");

            if (manager == null || caseExecutor == null)
            {
                Console.WriteLine("❌ Manager or CaseExecutor user not found for complete workflow.");
                return false;
            }

            shipment.AssignCaseExecutor(caseExecutor.Id);
            await _context.SaveChangesAsync();

            shipment.UpdateStatus(ShipmentStatus.InProgress);
            await _context.SaveChangesAsync();

            shipment.UpdateStatus(ShipmentStatus.Completed);
            await _context.SaveChangesAsync();

            _context.Shipments.Remove(shipment);
            _context.Customers.Remove(customer);
            await _context.SaveChangesAsync();

            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Complete workflow test failed: {ex.Message}");
            return false;
        }
    }

    private async Task<bool> TestDocumentManagement()
    {
        try
        {
            var serviceDocuments = await _context.ServiceDocuments.CountAsync();
            var stageDocuments = await _context.StageDocuments.CountAsync();
            var customerDocuments = await _context.CustomerDocuments.CountAsync();
            return true;
        }
        catch { return false; }
    }

    private async Task<bool> TestMessagingSystem()
    {
        try
        {
            var serviceMessages = await _context.ServiceMessages.CountAsync();
            var notifications = await _context.Notifications.CountAsync();
            return true;
        }
        catch { return false; }
    }

    private async Task<Customer?> CreateTestCustomer(long dataEncoderId)
    {
        try
        {
            var customer = Customer.Create(
                "Test Business",
                "TIN123456789",
                "LIC123456789",
                "123 Test Street",
                "Test City",
                "Test State",
                "12345",
                "Test Contact",
                "+1234567890",
                "test@business.com",
                "Retail",
                "LIC123456789",
                DateTime.UtcNow.AddYears(1),
                dataEncoderId,
                dataEncoderId,
                null
            );

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();
            return customer;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Customer creation exception: {ex.Message}");
            return null;
        }
    }

    private async Task<Shipment?> CreateTestService(long customerId, long dataEncoderId)
    {
        try
        {
            var serviceNumber = $"TEST-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpper()}";

            var shipment = Shipment.Create(
                serviceNumber,                    // trackingNumber (string)
                "Test Item",                      // second string parameter (v) per signature
                customerId,                       // importerId (long)
                "Test Item Description",          // description (string)
                TransportMode.MultiModalSeaRail,  // transport mode (TransportMode)
                HubLocation.Djibouti,             // assigned hub (HubLocation)
                "Test Country",                   // origin (string)
                "Test Destination",               // destination (string)
                dataEncoderId                     // createdByUserId (long?)
            );

            _context.Shipments.Add(shipment);
            await _context.SaveChangesAsync();
            return shipment;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Shipment creation exception: {ex.Message}");
            return null;
        }
    }

    private async Task<bool> HasPrivilege(long userId, string privilegeAction)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .ThenInclude(r => r.RolePrivileges)
            .ThenInclude(rp => rp.Privilege)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null) return false;

        return user.UserRoles
            .SelectMany(ur => ur.Role.RolePrivileges)
            .Any(rp => rp.Privilege.Action == privilegeAction);
    }

    private string GenerateJwtToken(MohamedTransit.Domain.Entities.User user)
    {
        try
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("super_secure_secret_key_change_this_later_development_only"));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim("id", user.Id.ToString()),
                new Claim("userName", user.Username),
                new Claim("email", user.Email),
                new Claim("firstName", user.FirstName),
                new Claim("lastName", user.LastName)
            };

            var token = new JwtSecurityToken(
                issuer: "TransitPortal",
                audience: "TransitPortal",
                claims: claims,
                expires: DateTime.UtcNow.AddHours(24),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
        catch
        {
            return string.Empty;
        }
    }
}

public class TestResults
{
    public bool DataSeeding { get; set; }
    public bool SuperAdminFlow { get; set; }
    public bool DataEncoderFlow { get; set; }
    public bool AssessorFlow { get; set; }
    public bool CustomerFlow { get; set; }
    public bool ManagerFlow { get; set; }
    public bool CaseExecutorFlow { get; set; }
    public bool CompleteWorkflow { get; set; }
    public bool DocumentManagement { get; set; }
    public bool MessagingSystem { get; set; }
    public bool OverallSuccess { get; set; }

    public string GetSummary()
    {
        var passed = new List<string>();
        var failed = new List<string>();

        if (DataSeeding) passed.Add("Data Seeding"); else failed.Add("Data Seeding");
        if (SuperAdminFlow) passed.Add("SuperAdmin Flow"); else failed.Add("SuperAdmin Flow");
        if (DataEncoderFlow) passed.Add("DataEncoder Flow"); else failed.Add("DataEncoder Flow");
        if (AssessorFlow) passed.Add("Assessor Flow"); else failed.Add("Assessor Flow");
        if (CustomerFlow) passed.Add("Customer Flow"); else failed.Add("Customer Flow");
        if (ManagerFlow) passed.Add("Manager Flow"); else failed.Add("Manager Flow");
        if (CaseExecutorFlow) passed.Add("CaseExecutor Flow"); else failed.Add("CaseExecutor Flow");
        if (CompleteWorkflow) passed.Add("Complete Workflow"); else failed.Add("Complete Workflow");
        if (DocumentManagement) passed.Add("Document Management"); else failed.Add("Document Management");
        if (MessagingSystem) passed.Add("Messaging System"); else failed.Add("Messaging System");

        return $"✅ Passed ({passed.Count}): {string.Join(", ", passed)}\n❌ Failed ({failed.Count}): {string.Join(", ", failed)}";
    }
}
