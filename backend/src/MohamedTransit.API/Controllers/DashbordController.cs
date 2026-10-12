using System.IdentityModel.Tokens.Jwt;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MohamedTransit.API.Controllers;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;
namespace MohamedTransit.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class DashboardController : BaseController
{
    private readonly ApplicationDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public DashboardController(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
    }

    /// <summary>
    /// Get admin dashboard data
    /// </summary>
    [HttpGet("View")]
    public async Task<IActionResult> GetAdminDashboardData()
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null)
            return Unauthorized("User not authenticated");

        // Check if user has dashboard view privilege
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .ThenInclude(r => r.RolePrivileges)
            .ThenInclude(rp => rp.Privilege)
            .FirstOrDefaultAsync(u => u.Id == currentUserId.Value);

        if (user == null)
            return Unauthorized("User not found");

        // Check if user has Dashboard-View privilege
        var hasDashboardPrivilege = user.UserRoles
            .SelectMany(ur => ur.Role.RolePrivileges)
            .Any(rp => rp.Privilege.Action == "Dashboard-View");

        if (!hasDashboardPrivilege)
            return StatusCode(StatusCodes.Status403Forbidden, "Access denied. Dashboard view privilege required.");

        var dashboardData = new
        {
            activeServicesCount = await _context.Shipments.CountAsync(s => s.RecordStatus == RecordStatus.Active),
            activeCustomersCount = await _context.Customers.CountAsync(c => c.RecordStatus == RecordStatus.Active),
            activeDocumentsCount = await _context.ServiceDocuments.CountAsync(d => d.RecordStatus == RecordStatus.Active),
            activeMessagesCount = await _context.ServiceMessages.CountAsync(m => m.RecordStatus == RecordStatus.Active),
            activeNotificationsCount = await _context.Notifications.CountAsync(n => n.RecordStatus == RecordStatus.Active),
            pendingApprovalsCount = await _context.Customers.CountAsync(c => c.RecordStatus == RecordStatus.Active && !c.IsVerified),
            activeUsersCount = await _context.Users.CountAsync(u => u.RecordStatus == RecordStatus.Active)
        };

        return HandleSuccessResponse(dashboardData);
    }

    /// <summary>
    /// Get admin dashboard data with sorting
    /// </summary>
    [HttpGet("ViewSort")]
    public async Task<IActionResult> GetAdminDashboardDataSort()
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null)
            return Unauthorized("User not authenticated");

        // Check if user has dashboard view privilege
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .ThenInclude(r => r.RolePrivileges)
            .ThenInclude(rp => rp.Privilege)
            .FirstOrDefaultAsync(u => u.Id == currentUserId.Value);

        if (user == null)
            return Unauthorized("User not found");

        // Check if user has Dashboard-View privilege
        var hasDashboardPrivilege = user.UserRoles
            .SelectMany(ur => ur.Role.RolePrivileges)
            .Any(rp => rp.Privilege.Action == "Dashboard-View");

        if (!hasDashboardPrivilege)
            return StatusCode(StatusCodes.Status403Forbidden, "Access denied. Dashboard view privilege required.");

        // Get user-based statistics (since there's no organization concept in this system)
        var userStats = await _context.Users
            .Where(u => u.RecordStatus == RecordStatus.Active)
            .Select(u => new
            {
                organizationName = "System Users", // Default since no organization concept
                numberOfUsers = _context.Users.Count(us => us.RecordStatus == RecordStatus.Active),
                numberOfServices = _context.Shipments.Count(s => s.RecordStatus == RecordStatus.Active),
                numberOfCustomers = _context.Customers.Count(c => c.RecordStatus == RecordStatus.Active),
                approvedOrders = _context.Shipments.Count(s => s.Status == Domain.Common.ShipmentStatus.Completed && s.RecordStatus == RecordStatus.Active)
            })
            .FirstOrDefaultAsync();

        return HandleSuccessResponse(new[] { userStats });
    }

    /// <summary>
    /// Get organization dashboard data
    /// </summary>
    [HttpGet("Organization/{organizationId}")]
    public async Task<IActionResult> GetOrganizationDashboardData(long organizationId)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null)
            return Unauthorized("User not authenticated");

        // Check if user has dashboard view privilege
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .ThenInclude(r => r.RolePrivileges)
            .ThenInclude(rp => rp.Privilege)
            .FirstOrDefaultAsync(u => u.Id == currentUserId.Value);

        if (user == null)
            return Unauthorized("User not found");

        // Check if user has Dashboard-View privilege
        var hasDashboardPrivilege = user.UserRoles
            .SelectMany(ur => ur.Role.RolePrivileges)
            .Any(rp => rp.Privilege.Action == "Dashboard-View");

        if (!hasDashboardPrivilege)
            return StatusCode(StatusCodes.Status403Forbidden, "Access denied. Dashboard view privilege required.");

        var dashboardData = new
        {
            count = new
            {
                activeServicesCount = await _context.Shipments.CountAsync(s => s.RecordStatus == RecordStatus.Active),
                activeCustomersCount = await _context.Customers.CountAsync(c => c.RecordStatus == RecordStatus.Active),
                activeDocumentsCount = await _context.ServiceDocuments.CountAsync(d => d.RecordStatus == RecordStatus.Active),
                activeUsersCount = await _context.Users.CountAsync(u => u.RecordStatus == RecordStatus.Active)
            }
        };

        return HandleSuccessResponse(dashboardData);
    }

    /// <summary>
    /// Get organization dashboard data with sorting
    /// </summary>
    [HttpGet("OrganizationSort/{organizationId}")]
    public async Task<IActionResult> GetByOrganizationIdWithDateSort(long organizationId)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null)
            return Unauthorized("User not authenticated");

        // Check if user has dashboard view privilege
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .ThenInclude(r => r.RolePrivileges)
            .ThenInclude(rp => rp.Privilege)
            .FirstOrDefaultAsync(u => u.Id == currentUserId.Value);

        if (user == null)
            return Unauthorized("User not found");

        // Check if user has Dashboard-View privilege
        var hasDashboardPrivilege = user.UserRoles
            .SelectMany(ur => ur.Role.RolePrivileges)
            .Any(rp => rp.Privilege.Action == "Dashboard-View");

        if (!hasDashboardPrivilege)
            return StatusCode(StatusCodes.Status403Forbidden, "Access denied. Dashboard view privilege required.");

        // Get services with details
        var services = await _context.Shipments
            .Include(s => s.Importer)
            .Where(s => s.RecordStatus == RecordStatus.Active)
            .OrderByDescending(s => s.CreateAt)
            .Select(s => new
            {
                fullName = s.Importer.FirstName + " " + s.Importer.LastName,
                phoneNumber = s.Importer.Phone,
                emailAddress = s.Importer.Email,
                company = "MOT System", // Default value since no organization concept
                isInside = true, // Default value
                cateringType = "Standard", // Default value
                numberOfGuests = 1, // Default value
                additionalRequest = s.Description,
                eventAddress = s.RouteCategory,
                eventStartDate = s.CreateAt,
                eventEndDate = s.CreateAt.AddDays(30), // Default value
                orderStatus = s.Status.ToString(),
                packageName = s.ServiceType.ToString()
            })
            .ToListAsync();

        return HandleSuccessResponse(services);
    }

    private long? GetCurrentUserId()
    {
        var authorizationHeader = _httpContextAccessor.HttpContext?.Request.Headers["Authorization"].ToString();
        if (string.IsNullOrEmpty(authorizationHeader) || !authorizationHeader.StartsWith("Bearer "))
            return null;

        var token = authorizationHeader.Replace("Bearer ", "");

        try
        {
            var handler = new JwtSecurityTokenHandler();
            var jsonToken = handler.ReadJwtToken(token);

            // Look for the "id" claim in the JWT token
            var idClaim = jsonToken.Claims.FirstOrDefault(x => x.Type == "id");
            if (idClaim != null && long.TryParse(idClaim.Value, out var userId))
                return userId;

            // If no "id" claim, try to get user ID from username
            var userNameClaim = jsonToken.Claims.FirstOrDefault(x => x.Type == "userName");
            if (userNameClaim != null)
            {
                var user = _context.Users.FirstOrDefault(u => u.Username == userNameClaim.Value);
                if (user != null)
                    return user.Id;
            }

            return null;
        }
        catch
        {
            return null;
        }
    }
}
