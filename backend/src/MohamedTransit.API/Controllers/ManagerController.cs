using Mapster;

using MediatR;

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MohamedTransit.Domain.Common;
using MohamedTransit.API.DTO.MOT.Request;
using MohamedTransit.API.DTO.MOT.Response;
using MohamedTransit.API.Helpers;
using MohamedTransit.Application;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;



namespace MohamedTransit.API.Controllers.MOT;
 
[ApiController]
[Route("api/v1/[controller]")]
public class ManagerController : BaseController
{
    private readonly ApplicationDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IMediator _mediator;

    public ManagerController(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor, IMediator mediator)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
        _mediator = mediator;
    }

    /// <summary>
    /// Get dashboard analytics and key metrics
    /// </summary>
    [HttpGet("GetDashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var currentUserId = JwtHelper.GetCurrentUserId(_httpContextAccessor, _context);
        if (currentUserId == null)
            return Unauthorized("User not authenticated");

        // Verify user is manager
        if (!await IsManager(currentUserId.Value))
            return StatusCode(StatusCodes.Status403Forbidden, "Access denied. Manager role required.");

        var currentDate = DateTime.UtcNow;
        var currentMonthStart = new DateTime(currentDate.Year, currentDate.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var nextMonthStart = currentMonthStart.AddMonths(1);
        var openStatuses = new[]
        {
            ShipmentStatus.Submitted,
            ShipmentStatus.UnderReview,
            ShipmentStatus.Approved,
            ShipmentStatus.InProgress
        };
        var openCases = _context.Shipments.Where(s =>
            s.RecordStatus == RecordStatus.Active &&
            openStatuses.Contains(s.Status));

        var riskAttentionIds = openCases
            .Where(s => s.RiskLevel == RiskLevel.Red || s.RiskLevel == RiskLevel.Yellow)
            .Select(s => s.Id);
        var stageAttentionIds = _context.ServiceStageExecutions
            .Where(stage =>
                stage.RecordStatus == RecordStatus.Active &&
                stage.ShipmentId.HasValue &&
                stage.Shipment != null &&
                stage.Shipment.RecordStatus == RecordStatus.Active &&
                openStatuses.Contains(stage.Shipment.Status) &&
                (stage.IsBlocked ||
                 stage.RequiresCustomerAction ||
                 stage.Status == StageStatus.NeedsReview))
            .Select(stage => stage.ShipmentId!.Value)
            .Distinct();

        var dashboard = new MohamedTransit.API.DTO.MOT.Response.ManagerDashboardResponse
        {
            TotalServices = await _context.Shipments.CountAsync(),
            PendingServices = await _context.Shipments.CountAsync(s => s.Status == ShipmentStatus.Submitted),
            InProgressServices = await _context.Shipments.CountAsync(s => s.Status == ShipmentStatus.InProgress),
            CompletedServices = await _context.Shipments.CountAsync(s => s.Status == ShipmentStatus.Completed),
            OpenCases = await openCases.CountAsync(),
            NeedsAttention = await riskAttentionIds.Union(stageAttentionIds).CountAsync(),
            DueWithin48Hours = null,
            ClearedThisMonth = await _context.Shipments.CountAsync(s =>
                s.RecordStatus == RecordStatus.Active &&
                s.Status == ShipmentStatus.Completed &&
                s.UpdatedAt >= currentMonthStart &&
                s.UpdatedAt < nextMonthStart),
            TotalCustomers = await _context.Customers.CountAsync(),
            VerifiedCustomers = await _context.Customers.CountAsync(c => c.IsVerified),
            TotalStaff = await _context.Users.CountAsync(),
            ActiveStaff = await _context.Users.CountAsync(u => u.RecordStatus == RecordStatus.Active)
        };

        // Get recent services mapped directly to ShipmentDetail using Mapster
        dashboard.RecentServices = await _context.Shipments
            .Include(s => s.Importer)
            .Include(s => s.AssignedCaseExecutor)
            .OrderByDescending(s => s.CreateAt)
            .Take(10)
            .ProjectToType<ShipmentDetail>() 
            .ToListAsync();

        // Get service completion rates by month
        var sixMonthsAgo = currentDate.AddMonths(-6);

        dashboard.MonthlyServiceStats = await _context.Shipments
            .Where(s => s.CreateAt >= sixMonthsAgo)
            .GroupBy(s => new { s.CreateAt.Year, s.CreateAt.Month })
            .Select(g => new MonthlyServiceStat
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                TotalServices = g.Count(),
                CompletedServices = g.Count(s => s.Status == ShipmentStatus.Completed),
                CompletionRate = g.Count(s => s.Status == ShipmentStatus.Completed) * 100.0 / g.Count()
            })
            .OrderBy(s => s.Year)
            .ThenBy(s => s.Month)
            .ToListAsync();

        return HandleSuccessResponse(dashboard);
    }

    /// <summary>
    /// Get live reporting metrics for the manager analytics page.
    /// </summary>
    [HttpGet("GetReportsAnalytics")]
    public async Task<IActionResult> GetReportsAnalytics()
    {
        var currentUserId = JwtHelper.GetCurrentUserId(_httpContextAccessor, _context);
        if (currentUserId == null)
            return Unauthorized("User not authenticated");

        if (!await IsManager(currentUserId.Value))
            return StatusCode(StatusCodes.Status403Forbidden, "Access denied. Manager role required.");

        var now = DateTime.UtcNow;
        var yearStart = new DateTime(now.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var recentStart = now.AddDays(-90);
        var firstReportMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(-5);
        var openStatuses = new[]
        {
            ShipmentStatus.Submitted,
            ShipmentStatus.UnderReview,
            ShipmentStatus.Approved,
            ShipmentStatus.InProgress
        };

        var shipments = await _context.Shipments
            .Where(shipment => shipment.RecordStatus == RecordStatus.Active)
            .Select(shipment => new
            {
                shipment.Id,
                shipment.Status,
                shipment.ServiceType,
                shipment.Mode,
                shipment.RiskLevel,
                shipment.AssignedCaseExecutorId,
                shipment.CreateAt,
                shipment.CompletedAt,
                ExecutorFirstName = shipment.AssignedCaseExecutor == null
                    ? null
                    : shipment.AssignedCaseExecutor.FirstName,
                ExecutorLastName = shipment.AssignedCaseExecutor == null
                    ? null
                    : shipment.AssignedCaseExecutor.LastName,
                ExecutorUsername = shipment.AssignedCaseExecutor == null
                    ? null
                    : shipment.AssignedCaseExecutor.Username
            })
            .ToListAsync();

        var monthlyThroughput = Enumerable.Range(0, 6)
            .Select(offset => firstReportMonth.AddMonths(offset))
            .Select(monthStart =>
            {
                var nextMonth = monthStart.AddMonths(1);
                var monthShipments = shipments.Where(shipment =>
                    shipment.CreateAt >= monthStart && shipment.CreateAt < nextMonth);
                var completedShipments = shipments.Count(shipment =>
                    shipment.CompletedAt >= monthStart &&
                    shipment.CompletedAt < nextMonth);

                return new ManagerMonthlyThroughput
                {
                    Year = monthStart.Year,
                    Month = monthStart.Month,
                    Multimodal = monthShipments.Count(shipment =>
                        shipment.ServiceType == ServiceType.Multimodal ||
                        (shipment.ServiceType == null && shipment.Mode == TransportMode.MultiModalSeaRail)),
                    Unimodal = monthShipments.Count(shipment =>
                        shipment.ServiceType == ServiceType.Unimodal ||
                        (shipment.ServiceType == null && shipment.Mode == TransportMode.UniModalRoad)),
                    Completed = completedShipments
                };
            })
            .ToList();

        var riskChannels = shipments
            .Where(shipment => shipment.RiskLevel.HasValue)
            .GroupBy(shipment => shipment.RiskLevel!.Value)
            .Select(group => new ManagerRiskChannelCount
            {
                Channel = group.Key.ToString(),
                Count = group.Count()
            })
            .OrderBy(item => item.Channel)
            .ToList();

        var completedStages = await _context.ServiceStageExecutions
            .Where(stage =>
                stage.RecordStatus == RecordStatus.Active &&
                stage.Shipment != null &&
                stage.Shipment.RecordStatus == RecordStatus.Active &&
                stage.StartedAt.HasValue &&
                stage.CompletedAt.HasValue &&
                stage.CompletedAt >= recentStart &&
                stage.CompletedAt <= now)
            .Select(stage => new
            {
                stage.Stage,
                stage.StartedAt,
                stage.CompletedAt
            })
            .ToListAsync();

        var stageDurations = completedStages
            .Select(stage => new
            {
                stage.Stage,
                Hours = (stage.CompletedAt!.Value - stage.StartedAt!.Value).TotalHours
            })
            .Where(stage => stage.Hours >= 0)
            .GroupBy(stage => stage.Stage)
            .OrderBy(group => group.Key)
            .Select(group => new ManagerStageDuration
            {
                Stage = group.Key.ToString(),
                AverageHours = Math.Round(group.Average(stage => stage.Hours), 1)
            })
            .ToList();

        var executorPerformance = shipments
            .Where(shipment =>
                shipment.AssignedCaseExecutorId.HasValue &&
                (openStatuses.Contains(shipment.Status) ||
                 (shipment.Status == ShipmentStatus.Completed &&
                  shipment.CompletedAt >= recentStart &&
                  shipment.CompletedAt <= now)))
            .GroupBy(shipment => new
            {
                Id = shipment.AssignedCaseExecutorId!.Value,
                shipment.ExecutorFirstName,
                shipment.ExecutorLastName,
                shipment.ExecutorUsername
            })
            .Select(group =>
            {
                var recentCompleted = group
                    .Where(shipment =>
                        shipment.Status == ShipmentStatus.Completed &&
                        shipment.CompletedAt >= recentStart &&
                        shipment.CompletedAt <= now)
                    .Where(shipment => shipment.CompletedAt.HasValue)
                    .ToList();
                var cycleDays = recentCompleted
                    .Select(shipment => (shipment.CompletedAt!.Value - shipment.CreateAt).TotalDays)
                    .Where(days => days >= 0)
                    .ToList();

                return new ManagerExecutorPerformance
                {
                    ExecutorId = group.Key.Id,
                    ExecutorName = string.Join(" ", new[]
                        {
                            group.Key.ExecutorFirstName,
                            group.Key.ExecutorLastName
                        }
                        .Where(name => !string.IsNullOrWhiteSpace(name)))
                        .Trim() is { Length: > 0 } name
                        ? name
                        : group.Key.ExecutorUsername ?? "Unnamed executor",
                    CasesClosed = recentCompleted.Count,
                    AverageCycleDays = cycleDays.Count > 0
                        ? Math.Round(cycleDays.Average(), 1)
                        : null,
                    OpenLoad = group.Count(shipment => openStatuses.Contains(shipment.Status))
                };
            })
            .Where(item => item.CasesClosed > 0 || item.OpenLoad > 0)
            .OrderByDescending(item => item.CasesClosed + item.OpenLoad)
            .ToList();

        var validDurations = completedStages
            .Select(stage => (stage.CompletedAt!.Value - stage.StartedAt!.Value).TotalHours)
            .Where(hours => hours >= 0)
            .ToList();

        var report = new ManagerReportsResponse
        {
            OpenCases = shipments.Count(shipment => openStatuses.Contains(shipment.Status)),
            CompletedYearToDate = shipments.Count(shipment =>
                shipment.Status == ShipmentStatus.Completed &&
                shipment.CompletedAt >= yearStart &&
                shipment.CompletedAt <= now),
            OnTimeClearanceRate = null,
            AverageStageDurationHours = validDurations.Count > 0
                ? Math.Round(validDurations.Average(), 1)
                : null,
            MonthlyThroughput = monthlyThroughput,
            RiskChannels = riskChannels,
            StageDurations = stageDurations,
            ExecutorPerformance = executorPerformance
        };

        return HandleSuccessResponse(report);
    }

    /// <summary>
    /// Get all services with filtering options
    /// </summary>
    [HttpGet("GetAllServices")]
    public async Task<IActionResult> GetAllServices(
        [FromQuery] ShipmentStatus? status = null,
        [FromQuery] ServiceType? type = null,
        [FromQuery] long? customerId = null,
        [FromQuery] long? caseExecutorId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var currentUserId = JwtHelper.GetCurrentUserId(_httpContextAccessor, _context);
        if (currentUserId == null)
            return Unauthorized("User not authenticated");

        if (!await IsManager(currentUserId.Value))
            return StatusCode(StatusCodes.Status403Forbidden, "Access denied. Manager role required.");

        var query = _context.Shipments
            .Include(s => s.Importer)
            .Include(s => s.AssignedCaseExecutor)
            .Include(s => s.AssignedAssessor)
            .Include(s => s.CreatedByUserId)
            .AsQueryable();

        if (status.HasValue)
            query = query.Where(s => s.Status == status.Value);

        if (type.HasValue)
            query = query.Where(s => s.ServiceType == type.Value);

        if (customerId.HasValue)
            query = query.Where(s => s.ImporterId == customerId.Value);

        if (caseExecutorId.HasValue)
            query = query.Where(s => s.AssignedCaseExecutorId == caseExecutorId.Value);

        var totalCount = await query.CountAsync();
        var services = await query
            .OrderByDescending(s => s.CreateAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var result = new MohamedTransit.API.DTO.MOT.Response.PaginatedResult<Shipment>
        {
            Data = services,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
        };

        return HandleSuccessResponse(result);
    }

    /// <summary>
    /// Get service details for management oversight
    /// </summary>
    [HttpGet("GetServiceById")]
    public async Task<IActionResult> GetServiceById([FromQuery] long serviceId)
    {
        var currentUserId = JwtHelper.GetCurrentUserId(_httpContextAccessor, _context);
        if (currentUserId == null)
            return Unauthorized("User not authenticated");

        if (!await IsManager(currentUserId.Value))
            return StatusCode(StatusCodes.Status403Forbidden, "Access denied. Manager role required.");

        var service = await _context.Shipments
            .Include(s => s.Importer)
            .Include(s => s.AssignedCaseExecutor)
            .Include(s => s.AssignedAssessor)
            .Include(s => s.CreatedByUserId)
            .Include(s => s.Stages)
                .ThenInclude(stage => stage.StageComments)
            .Include(s => s.Stages)
                .ThenInclude(stage => stage.Documents)
            .Include(s => s.Documents)
            .Include(s => s.Messages)
            .FirstOrDefaultAsync(s => s.Id == serviceId);

        if (service == null)
            return NotFound("Service not found");

        return HandleSuccessResponse(service);
    }

    /// <summary>
    /// Assign case executor to a service
    /// </summary>
    [HttpPut("AssignExecutor")]
    public async Task<IActionResult> AssignExecutor([FromBody] AssignExecutorRequest request)
    {
        var currentUserId = JwtHelper.GetCurrentUserId(_httpContextAccessor, _context);
        if (currentUserId == null)
            return Unauthorized("User not authenticated");

        if (!await IsManager(currentUserId.Value))
            return StatusCode(StatusCodes.Status403Forbidden, "Access denied. Manager role required.");

        var command = new AssignShipmentCommand
        {
            ShipmentId = request.ShipmentId,
            AssignedCaseExecutorId = request.CaseExecutorId,
            AssignedAssessorId = null,
            AssignmentNotes = null,
            AssignedByUserId = currentUserId.Value
        };

        var result = await _mediator.Send(command);

        return result.IsError ? HandleErrorResponse(result.Errors) : HandleSuccessResponse(result.Payload);
    }

    /// <summary>
    /// Get all customers with filtering
    /// </summary>
    [HttpGet("GetAllCustomers")]
    public async Task<IActionResult> GetAllCustomers(
        [FromQuery] bool? isVerified = null,
        [FromQuery] string? searchTerm = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var currentUserId = JwtHelper.GetCurrentUserId(_httpContextAccessor, _context);
        if (currentUserId == null)
            return Unauthorized("User not authenticated");

        if (!await IsManager(currentUserId.Value))
            return StatusCode(StatusCodes.Status403Forbidden, "Access denied. Manager role required.");

        var query = _context.Customers
            .Include(c => c.User)
            .Include(c => c.CreatedByDataEncoder)
            .Include(c => c.VerifiedByUser)
            .AsQueryable();

        if (isVerified.HasValue)
            query = query.Where(c => c.IsVerified == isVerified.Value);

        if (!string.IsNullOrEmpty(searchTerm))
        {
            query = query.Where(c =>
                c.BusinessName.Contains(searchTerm) ||
                c.TINNumber.Contains(searchTerm) ||
                c.ContactEmail.Contains(searchTerm));
        }

        var totalCount = await query.CountAsync();
        var customers = await query
            .OrderByDescending(c => c.CreateAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var result = new MohamedTransit.API.DTO.MOT.Response.PaginatedResult<Customer>
        {
            Data = customers,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
        };

        return HandleSuccessResponse(result);
    }

    /// <summary>
    /// Get all staff members
    /// </summary>
    [HttpGet("GetAllStaff")]
    public async Task<IActionResult> GetAllStaff([FromQuery] string? role = null)
    {
        var currentUserId = JwtHelper.GetCurrentUserId(_httpContextAccessor, _context);
        if (currentUserId == null)
            return Unauthorized("User not authenticated");

        if (!await IsManager(currentUserId.Value))
            return StatusCode(StatusCodes.Status403Forbidden, "Access denied. Manager role required.");

        var query = _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .Where(u => u.RecordStatus == RecordStatus.Active)
            .AsQueryable();

        if (!string.IsNullOrEmpty(role))
        {
            query = query.Where(u => u.UserRoles.Any(ur => ur.Role.Name == role));
        }

        var staff = await query.ToListAsync();

        return HandleSuccessResponse(staff);
    }

    /// <summary>
    /// Get system notifications for managers
    /// </summary>
    [HttpGet("GetNotifications")]
    public async Task<IActionResult> GetNotifications([FromQuery] bool unreadOnly = false)
    {
        var currentUserId = JwtHelper.GetCurrentUserId(_httpContextAccessor, _context);
        if (currentUserId == null)
            return Unauthorized("User not authenticated");

        if (!await IsManager(currentUserId.Value))
            return StatusCode(StatusCodes.Status403Forbidden, "Access denied. Manager role required.");

        var query = _context.Notifications
            .Include(n => n.Shipment)
            .Include(n => n.User)
            .Where(n => n.Type == NotificationType.SystemAlert || n.IsUrgent);

        if (unreadOnly)
            query = query.Where(n => !n.IsRead);

        var notifications = await query
            .OrderByDescending(n => n.CreateAt)
            .ToListAsync();

        return HandleSuccessResponse(notifications);
    }


    private async Task<bool> IsManager(long userId)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == userId);

        return user?.UserRoles.Any(ur => ur.Role.Name == "Manager") ?? false;
    }
}
