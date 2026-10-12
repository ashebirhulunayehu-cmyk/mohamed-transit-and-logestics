using Mapster;

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MohamedTransit.API.DTO.MOT.Response;
using MohamedTransit.API.DTO.Document.Request;
using MohamedTransit.API.Helpers;
using MohamedTransit.Application.Commands;
using MohamedTransit.Application.Queries.Customer.CaseExecuter;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;
using MohamedTransit.API.DTO.Document.Response;
using MohamedTransit.Application.DTO;
using MohamedTransit.Domain.Entities;
using MohamedTransit.API.DTO.MOT.Request;
namespace MohamedTransit.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class CaseExecutorController : BaseController
{
    private readonly ApplicationDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CaseExecutorController(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
    }

    /// <summary>
    /// Get assigned services for the case executor
    /// </summary>
    [HttpGet("GetAssignedServices")]
    public async Task<IActionResult> GetAssignedServices([FromQuery] RecordStatus? recordStatus)
    {
        var currentUserId = JwtHelper.GetCurrentUserId(_httpContextAccessor, _context);
        if (currentUserId == null)
            return Unauthorized("User not authenticated");
        var query = new GetAssignedServicesQuery { AssignedCaseExecutorId = currentUserId.Value, RecordStatus = recordStatus };
        var result = await _mediator.Send(query);
        var rolesList = result.Payload.Adapt<List<ShipmentDetail>>();
        return result.IsError ? HandleErrorResponse(result.Errors) : HandleSuccessResponse(rolesList);
    }

    /// <summary>
    /// Get service details for execution
    /// </summary>
    [HttpGet("GetAssignedServiceById")]
    public async Task<IActionResult> GetAssignedServiceById([FromQuery] long Id)
    {
        var currentUserId = JwtHelper.GetCurrentUserId(_httpContextAccessor, _context);
        if (currentUserId == null)
            return Unauthorized("User not authenticated");

        var query = new GetCaseExecutorAssignedServicesByIdQuery { Id = Id, AssignedCaseExecutorId = currentUserId.Value };
        var result = await _mediator.Send(query);
        // var rolesList = result.Payload.Adapt<List<ServiceDetail>>();
        return result.IsError ? HandleErrorResponse(result.Errors) : HandleSuccessResponse(result.Payload);
    }



    /// <summary>
    /// Upload document for a service stage
    /// </summary>
    [HttpPost("UploadStageDocument")]
    public async Task<IActionResult> UploadStageDocument([FromForm] UploadDocumentRequest request)
    {
        // 1?? Validate file
        if (request.File == null || request.File.Length == 0)
        {
            return BadRequest(new
            {
                Error = true,
                Message = "Document file is required."
            });
        }

        var command = new UploadDocumentCommand
        {
            ShipmentId = request.ShipmentId,
            StageId = request.StageId,
            File = request.File,
            DocumentType = request.DocumentType,
            Description = request.Description
            // FilePath can be added if already saved
        };


        // 6?? Send command to handler
        var result = await _mediator.Send(command);

        // 7?? Map payload to response DTO if needed
        var documentDetail = result.Payload?.Adapt<DocumentDetail>();

        // 8?? Return response
        return result.IsError
            ? HandleErrorResponse(result.Errors)
            : HandleSuccessResponse(documentDetail);
    }

    /// <summary>
    /// Add comment to a service stage
    /// </summary>
    [HttpPost("AddStageComment")]
    public async Task<IActionResult> AddStageComment([FromBody] AddStageCommentRequest request)
    {
        var currentUserId = JwtHelper.GetCurrentUserId(_httpContextAccessor, _context);
        if (currentUserId == null)
            return Unauthorized("User not authenticated");

        var stage = await _context.ShipmentStages
            .FirstOrDefaultAsync(s => s.Id == request.StageId && s.ShipmentId == request.ShipmentId);

        if (stage == null)
            return NotFound("Service stage not found");

        var comment = StageComment.Create(
            request.Comment,
            request.StageId,
            currentUserId.Value
        );

        _context.StageComments.Add(comment);
        await _context.SaveChangesAsync();

        return HandleSuccessResponse(comment);
    }

    /// <summary>
    /// Set risk level for a service
    /// </summary>
    [HttpPut("SetRiskLevel")]
    public async Task<IActionResult> SetRiskLevel([FromBody] SetRiskLevelRequest request)
    {
        var currentUserId = JwtHelper.GetCurrentUserId(_httpContextAccessor, _context);
        if (currentUserId == null)
            return Unauthorized("User not authenticated");

        var shipment = await _context.Shipments
            .FirstOrDefaultAsync(s => s.Id == request.ShipmentId);

        if (shipment == null)
            return NotFound("Shipment not found");

        shipment.UpdateRiskLevel(request.RiskLevel);

        // Add risk notes to the current stage if provided
        if (!string.IsNullOrEmpty(request.RiskNotes))
        {
            var currentStage = await _context.ShipmentStages
                .Where(s => s.ShipmentId == request.ShipmentId)
                .OrderByDescending(s => s.CreatedDate)
                .FirstOrDefaultAsync();

            if (currentStage != null)
            {
                currentStage.AddRiskNotes(request.RiskNotes);
            }
        }

        await _context.SaveChangesAsync();

        return HandleSuccessResponse(shipment);
    }

    /// <summary>
    /// Block a service stage
    /// </summary>
    [HttpPut("BlockStage")]
    public async Task<IActionResult> BlockStage([FromBody] BlockStageRequest request)
    {
        var currentUserId = JwtHelper.GetCurrentUserId(_httpContextAccessor, _context);
        if (currentUserId == null)
            return Unauthorized("User not authenticated");


        var stage = await _context.ShipmentStages
            .FirstOrDefaultAsync(s => s.Id == request.StageId && s.ShipmentId == request.ShipmentId);

        if (stage == null)
            return NotFound("Service stage not found");

        stage.SetBlocked(true, request.Reason);

        await _context.SaveChangesAsync();

        return HandleSuccessResponse(stage);
    }

    /// <summary>
    /// Get case executor dashboard
    /// </summary>
    [HttpGet("GetDashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var currentUserId = JwtHelper.GetCurrentUserId(_httpContextAccessor, _context);
        if (currentUserId == null)
            return Unauthorized("User not authenticated");

        var dashboard = new MohamedTransit.API.DTO.MOT.Response.CaseExecutorDashboardResponse
        {
            AssignedServices = await _context.Shipments.CountAsync(s => s.AssignedCaseExecutorId == currentUserId.Value),
            PendingServices = await _context.Shipments.CountAsync(s => s.AssignedCaseExecutorId == currentUserId.Value && s.Status == ShipmentStatus.InProgress),
            CompletedServices = await _context.Shipments.CountAsync(s => s.AssignedCaseExecutorId == currentUserId.Value && s.Status == ShipmentStatus.Completed),
            BlockedStages = await _context.ShipmentStages.CountAsync(s => s.Shipment.AssignedCaseExecutorId == currentUserId.Value && s.IsBlocked)
        };

        // Get today's tasks
        dashboard.TodaysTasks = await _context.ShipmentStages
            .Include(s => s.Shipment)
            .Where(s => s.Shipment.AssignedCaseExecutorId == currentUserId.Value &&
                       s.Status == StageStatus.Pending &&
                       s.CreatedDate.Date == DateTime.UtcNow.Date)
            .ToListAsync();

        // Get urgent notifications
        dashboard.UrgentNotifications = await _context.Notifications
            .Include(n => n.Shipment)
            .Where(n => n.UserId == currentUserId.Value && n.IsUrgent && !n.IsRead)
            .ToListAsync();

        return HandleSuccessResponse(dashboard);
    }

    [HttpGet("DownloadStageDocument")]
    public async Task<IActionResult> DownloadStageDocument(
     [FromQuery] long documentId)
    {
        var query = new DownloadStageDocumentQuery
        {
            DocumentId = documentId,
        };

        var result = await _mediator.Send(query);

        var docmunet = result.Payload.Adapt<DownloadDocumentResult>();
        return result.IsError ? HandleErrorResponse(result.Errors) : HandleSuccessResponse(docmunet);
    }
    [HttpPost("DownloadStageDocuments")]
    public async Task<IActionResult> DownloadStageDocuments(
        [FromBody] List<long> documentIds)
    {
        var query = new DownloadMultipleStageDocumentsQuery
        {
            DocumentIds = documentIds
        };

        var result = await _mediator.Send(query);

        var docmunetList = result.Payload.Adapt<List<DownloadDocumentResult>>();
        return result.IsError ? HandleErrorResponse(result.Errors) : HandleSuccessResponse(docmunetList);

    }
    private async Task<bool> IsCaseExecutor(long userId)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == userId);

        return user?.UserRoles.Any(ur => ur.Role.Name == "CaseExecutor") ?? false;
    }
}
