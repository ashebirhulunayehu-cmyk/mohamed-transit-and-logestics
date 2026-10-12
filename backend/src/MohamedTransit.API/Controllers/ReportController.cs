using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using MohamedTransit.API.Controllers;
using MohamedTransit.API.Helpers;
using MohamedTransit.Domain.Data;

using MohamedTransit.API.DTO.MOT.Response;
using MohamedTransit.API.Helpers;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.API.Controllers.MOT;

[ApiController]
[Route("api/v1/[controller]")]
public class ReportController : BaseController
{
    private readonly ApplicationDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ReportController(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
    }

    /// <summary>
    /// Get service statistics report
    /// </summary>
    [HttpGet("GetServiceStatistics")]
    public async Task<IActionResult> GetServiceStatistics(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] ShipmentStatus? status = null)
    {
        var currentUserId = JwtHelper.GetCurrentUserId(_httpContextAccessor, _context);
        if (currentUserId == null)
            return Unauthorized("User not authenticated");

        var query = _context.Shipments.AsQueryable();

        if (startDate.HasValue)
            query = query.Where(s => s.CreateAt>= startDate.Value);

        if (endDate.HasValue)
            query = query.Where(s => s.CreateAt <= endDate.Value);

        if (status.HasValue)
            query = query.Where(s => s.Status == status.Value);

        var totalServices = await query.CountAsync();
        var completedServices = await query.CountAsync(s => s.Status == ShipmentStatus.Completed);
        var pendingServices = await query.CountAsync(s => s.Status == ShipmentStatus.Submitted || s.Status == ShipmentStatus.UnderReview);
        var inProgressServices = await query.CountAsync(s => s.Status == ShipmentStatus.InProgress);
        var rejectedServices = await query.CountAsync(s => s.Status == ShipmentStatus.Rejected);

        // Calculate average processing time
        var completedServicesWithDates = await query
            .Where(s => s.Status == ShipmentStatus.Completed)
            .ToListAsync();

        var averageProcessingTime = completedServicesWithDates.Any()
     ? completedServicesWithDates.Average(s => ((s.UpdatedAt ?? s.CreateAt) - s.CreateAt).TotalDays)
     : 0;

        var report = new ServiceStatisticsReport
        {
            TotalServices = totalServices,
            CompletedServices = completedServices,
            PendingServices = pendingServices,
            InProgressServices = inProgressServices,
            RejectedServices = rejectedServices,
            AverageProcessingTime = Math.Round(averageProcessingTime, 2),
            CompletionRate = totalServices > 0 ? Math.Round((completedServices * 100.0) / totalServices, 2) : 0,
            StartDate = startDate,
            EndDate = endDate
        };

        return HandleSuccessResponse(report);
    }

    /// <summary>
    /// Get monthly service report
    /// </summary>
    [HttpGet("GetMonthlyReport")]
    public async Task<IActionResult> GetMonthlyReport(
        [FromQuery] int year,
        [FromQuery] int? month = null)
    {
        var currentUserId = JwtHelper.GetCurrentUserId(_httpContextAccessor, _context);
        if (currentUserId == null)
            return Unauthorized("User not authenticated");

        var query = _context.Shipments
            .Where(s => s.CreateAt.Year == year);

        if (month.HasValue)
            query = query.Where(s => s.CreateAt.Month == month.Value);

        var monthlyStats = await query
            .GroupBy(s => new { s.CreateAt.Year, s.CreateAt.Month })
            .Select(g => new MonthlyServiceReport
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                TotalServices = g.Count(),
                CompletedServices = g.Count(s => s.Status == ShipmentStatus.Completed),
                PendingServices = g.Count(s => s.Status == ShipmentStatus.Submitted || s.Status == ShipmentStatus.UnderReview),
                InProgressServices = g.Count(s => s.Status == ShipmentStatus.InProgress),
                RejectedServices = g.Count(s => s.Status == ShipmentStatus.Rejected),
                CompletionRate = g.Count(s => s.Status == ShipmentStatus.Completed) * 100.0 / g.Count()
            })
            .OrderBy(s => s.Year)
            .ThenBy(s => s.Month)
            .ToListAsync();

        return HandleSuccessResponse(monthlyStats);
    }

    /// <summary>
    /// Get customer statistics report
    /// </summary>
    [HttpGet("GetCustomerStatistics")]
    public async Task<IActionResult> GetCustomerStatistics(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        var currentUserId = JwtHelper.GetCurrentUserId(_httpContextAccessor, _context);
        if (currentUserId == null)
            return Unauthorized("User not authenticated");

        var query = _context.Customers.AsQueryable();

        if (startDate.HasValue)
            query = query.Where(c => c.CreateAt >= startDate.Value);

        if (endDate.HasValue)
            query = query.Where(c => c.CreateAt <= endDate.Value);

        var totalCustomers = await query.CountAsync();
        var verifiedCustomers = await query.CountAsync(c => c.IsVerified);
        var pendingCustomers = await query.CountAsync(c => !c.IsVerified);

        var report = new CustomerStatisticsReport
        {
            TotalCustomers = totalCustomers,
            VerifiedCustomers = verifiedCustomers,
            PendingCustomers = pendingCustomers,
            VerificationRate = totalCustomers > 0 ? Math.Round((verifiedCustomers * 100.0) / totalCustomers, 2) : 0,
            StartDate = startDate,
            EndDate = endDate
        };

        return HandleSuccessResponse(report);
    }

    /// <summary>
    /// Get comprehensive system report
    /// </summary>
    [HttpGet("GetSystemReport")]
    public async Task<IActionResult> GetSystemReport(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        var currentUserId = JwtHelper.GetCurrentUserId(_httpContextAccessor, _context);
        if (currentUserId == null)
            return Unauthorized("User not authenticated");

        var serviceQuery = _context.Shipments.AsQueryable();
        var customerQuery = _context.Customers.AsQueryable();

        if (startDate.HasValue)
        {
            serviceQuery = serviceQuery.Where(s => s.CreateAt >= startDate.Value);
            customerQuery = customerQuery.Where(c => c.CreateAt >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            serviceQuery = serviceQuery.Where(s => s.CreateAt <= endDate.Value);
            customerQuery = customerQuery.Where(c => c.CreateAt <= endDate.Value);
        }

        var totalServices = await serviceQuery.CountAsync();
        var completedServices = await serviceQuery.CountAsync(s => s.Status == ShipmentStatus.Completed);
        var totalCustomers = await customerQuery.CountAsync();
        var verifiedCustomers = await customerQuery.CountAsync(c => c.IsVerified);
        var totalDocuments = await _context.ServiceDocuments.CountAsync();
        var totalMessages = await _context.ServiceMessages.CountAsync();

        var report = new SystemReport
        {
            TotalServices = totalServices,
            CompletedServices = completedServices,
            TotalCustomers = totalCustomers,
            VerifiedCustomers = verifiedCustomers,
            TotalDocuments = totalDocuments,
            TotalMessages = totalMessages,
            ServiceCompletionRate = totalServices > 0 ? Math.Round((completedServices * 100.0) / totalServices, 2) : 0,
            CustomerVerificationRate = totalCustomers > 0 ? Math.Round((verifiedCustomers * 100.0) / totalCustomers, 2) : 0,
            StartDate = startDate,
            EndDate = endDate,
            GeneratedDate = DateTime.UtcNow
        };

        return HandleSuccessResponse(report);
    }
}

