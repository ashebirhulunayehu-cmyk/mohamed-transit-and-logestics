using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

using MohamedTransit.API.Controllers;
using MohamedTransit.API.Helpers;
using MohamedTransit.API.Services;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;
namespace MohamedTransit.API.Controllers.MOT;

[ApiController]
[Route("api/v1/[controller]")]
public class MessagingController : BaseController
{
    private readonly IMessagingService _messagingService;
    private readonly ApplicationDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public MessagingController(IMessagingService messagingService, ApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
    {
        _messagingService = messagingService;
        _context = context;
        _httpContextAccessor = httpContextAccessor;
    }

    [HttpGet("GetDirectoryUsers")]
    public async Task<IActionResult> GetDirectoryUsers(CancellationToken cancellationToken)
    {
        var currentUserId = JwtHelper.GetCurrentUserId(_httpContextAccessor, _context);
        if (currentUserId == null)
            return Unauthorized("User not authenticated");

        var users = await _context.Users
            .AsNoTracking()
            .Where(user => user.RecordStatus == RecordStatus.Active)
            .Select(user => new
            {
                user.Id,
                user.FirstName,
                user.LastName,
                user.Username,
                RoleNames = user.UserRoles
                    .Where(userRole => userRole.Role.RecordStatus == RecordStatus.Active)
                    .Select(userRole => userRole.Role.Name)
                    .ToArray()
            })
            .ToListAsync(cancellationToken);

        return HandleSuccessResponse(users);
    }

    [HttpPost("SendMessage")]
    public async Task<IActionResult> SendMessage([FromBody] MohamedTransit.API.DTO.MOT.Request.SendMessageRequest request)
    {
        try
        {
            // Get sender ID from JWT token
            var senderId = JwtHelper.GetCurrentUserId(_httpContextAccessor, _context);
            if (senderId == null)
                return Unauthorized("User not authenticated");

            var message = await _messagingService.SendMessageAsync(
                request.ShipmentId,
                senderId.Value, // Use sender ID from token
                request.Subject,
                request.Content,
                request.Type,
                request.RecipientId
            );

            return HandleSuccessResponse(new { Message = "Message sent successfully", MessageId = message.Id });
        }
        catch (Exception ex)
        {
            return HandleErrorResponse(ex);
        }
    }

    [HttpGet("GetServiceMessages")]
    public async Task<IActionResult> GetServiceMessages([FromQuery] long serviceId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            var messages = await _messagingService.GetServiceMessagesAsync(serviceId, page, pageSize);
            return HandleSuccessResponse(messages);
        }
        catch (Exception ex)
        {
            return HandleErrorResponse(ex);
        }
    }

    [HttpGet("GetUserMessages")]
    public async Task<IActionResult> GetUserMessages([FromQuery] long userId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            var messages = await _messagingService.GetUserMessagesAsync(userId, page, pageSize);
            return HandleSuccessResponse(messages);
        }
        catch (Exception ex)
        {
            return HandleErrorResponse(ex);
        }
    }

    [HttpGet("GetMessageById")]
    public async Task<IActionResult> GetMessageById([FromQuery] long messageId)
    {
        try
        {
            var message = await _messagingService.GetMessageAsync(messageId);
            if (message == null)
                return NotFound("Message not found");

            return HandleSuccessResponse(message);
        }
        catch (Exception ex)
        {
            return HandleErrorResponse(ex);
        }
    }

    [HttpPost("MarkMessageAsRead")]
    public async Task<IActionResult> MarkMessageAsRead([FromBody] MohamedTransit.API.DTO.MOT.Request.MarkMessageAsReadRequest request)
    {
        try
        {
            await _messagingService.MarkMessageAsReadAsync(request.MessageId, request.UserId);
            return HandleSuccessResponse(new { Message = "Message marked as read" });
        }
        catch (Exception ex)
        {
            return HandleErrorResponse(ex);
        }
    }

    [HttpGet("GetUnreadMessages")]
    public async Task<IActionResult> GetUnreadMessages([FromQuery] long userId)
    {
        try
        {
            var messages = await _messagingService.GetUnreadMessagesAsync(userId);
            return HandleSuccessResponse(messages);
        }
        catch (Exception ex)
        {
            return HandleErrorResponse(ex);
        }
    }

    [HttpGet("GetUnreadCount")]
    public async Task<IActionResult> GetUnreadCount([FromQuery] long userId)
    {
        try
        {
            var count = await _messagingService.GetUnreadMessageCountAsync(userId);
            return HandleSuccessResponse(new { UnreadCount = count });
        }
        catch (Exception ex)
        {
            return HandleErrorResponse(ex);
        }
    }

    [HttpPost("SendGroupMessage")]
    public async Task<IActionResult> SendGroupMessage([FromBody] MohamedTransit.API.DTO.MOT.Request.SendGroupMessageRequest request)
    {
        try
        {
            await _messagingService.SendGroupMessageAsync(
                request.ShipmentId,
                request.SenderId,
                request.Subject,
                request.Content,
                request.RecipientIds
            );

            return HandleSuccessResponse(new { Message = "Group message sent successfully" });
        }
        catch (Exception ex)
        {
            return HandleErrorResponse(ex);
        }
    }
}
