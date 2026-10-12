using Microsoft.AspNetCore.Mvc;

using MohamedTransit.API.Controllers;

using MohamedTransit.API.DTO.MOT.Request;
using MohamedTransit.API.Services;

using MohamedTransit.Domain.Entities;

namespace MohamedTransit.API.Controllers.MOT;

[ApiController]
[Route("api/v1/[controller]")]
public class NotificationController : BaseController
{
    private readonly INotificationService _notificationService;

    public NotificationController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet("GetUserNotifications")]
    public async Task<IActionResult> GetUserNotifications([FromQuery] long userId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            var notifications = await _notificationService.GetUserNotificationsAsync(userId, page, pageSize);
            var unreadCount = await _notificationService.GetUnreadNotificationCountAsync(userId);

            var response = new
            {
                Notifications = notifications,
                UnreadCount = unreadCount,
                Page = page,
                PageSize = pageSize
            };

            return HandleSuccessResponse(response);
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
            var count = await _notificationService.GetUnreadNotificationCountAsync(userId);
            return HandleSuccessResponse(new { UnreadCount = count });
        }
        catch (Exception ex)
        {
            return HandleErrorResponse(ex);
        }
    }

    [HttpPost("MarkNotificationAsRead")]
    public async Task<IActionResult> MarkNotificationAsRead([FromBody] MohamedTransit.API.DTO.MOT.Request.MarkNotificationAsReadRequest request)
    {
        try
        {
            await _notificationService.MarkNotificationAsReadAsync(request.NotificationId);
            return HandleSuccessResponse(new { Message = "Notification marked as read" });
        }
        catch (Exception ex)
        {
            return HandleErrorResponse(ex);
        }
    }

    [HttpPost("MarkAllNotificationsAsRead")]
    public async Task<IActionResult> MarkAllNotificationsAsRead([FromBody] MohamedTransit.API.DTO.MOT.Request.MarkAllNotificationsAsReadRequest request)
    {
        try
        {
            await _notificationService.MarkAllNotificationsAsReadAsync(request.UserId);
            return HandleSuccessResponse(new { Message = "All notifications marked as read" });
        }
        catch (Exception ex)
        {
            return HandleErrorResponse(ex);
        }
    }

    [HttpPost("CreateNotification")]
    public async Task<IActionResult> CreateNotification([FromBody] MohamedTransit.API.DTO.MOT.Request.CreateNotificationRequest request)
    {
        try
        {
            await _notificationService.CreateNotificationAsync(
                request.UserId,
                request.Title,
                request.Message,
                request.Type,
                request.ServiceId
            );

            return HandleSuccessResponse(new { Message = "Notification created successfully" });
        }
        catch (Exception ex)
        {
            return HandleErrorResponse(ex);
        }
    }

    [HttpPost("SendBulkNotification")]
    public async Task<IActionResult> SendBulkNotification([FromBody] MohamedTransit.API.DTO.MOT.Request.BulkNotificationRequest request)
    {
        try
        {
            await _notificationService.SendBulkNotificationAsync(
                request.UserIds,
                request.Title,
                request.Message,
                request.Type
            );

            return HandleSuccessResponse(new { Message = "Bulk notification sent successfully" });
        }
        catch (Exception ex)
        {
            return HandleErrorResponse(ex);
        }
    }
}
