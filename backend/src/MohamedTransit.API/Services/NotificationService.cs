using Microsoft.EntityFrameworkCore;

using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;


namespace MohamedTransit.API.Services;

public interface INotificationService
{
    Task CreateNotificationAsync(long userId, string title, string message, NotificationType type, long? serviceId = null);
    Task CreateServiceUpdateNotificationAsync(long serviceId, string message, NotificationType type);
    Task MarkNotificationAsReadAsync(long notificationId);
    Task MarkAllNotificationsAsReadAsync(long userId);
    Task<List<Notification>> GetUserNotificationsAsync(long userId, int page = 1, int pageSize = 20);
    Task<int> GetUnreadNotificationCountAsync(long userId);
    Task SendBulkNotificationAsync(List<long> userIds, string title, string message, NotificationType type);
}

public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _context;

    public NotificationService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task CreateNotificationAsync(long userId, string title, string message, NotificationType type, long? serviceId = null)
    {
        var notification = Notification.Create(
            title,
            message,
            type,
            userId,
            serviceId
        );

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();
    }

    public async Task CreateServiceUpdateNotificationAsync(long serviceId, string message, NotificationType type)
    {
        // Get the service to find the customer
        var service = await _context.Shipments
            .Include(s => s.Importer)
            .FirstOrDefaultAsync(s => s.Id == serviceId);

        if (service == null) return;

        // Notify the customer
        await CreateNotificationAsync(
            service.ImporterId,
            "Service Update",
            message,
            type,
            serviceId
        );

        // Notify assigned case executor if exists
        if (service.AssignedCaseExecutorId.HasValue)
        {
            await CreateNotificationAsync(
                service.AssignedCaseExecutorId.Value,
                "Service Update",
                message,
                type,
                serviceId
            );
        }

        // Notify assigned assessor if exists
        if (service.AssignedAssessorId.HasValue)
        {
            await CreateNotificationAsync(
                service.AssignedAssessorId.Value,
                "Service Update",
                message,
                type,
                serviceId
            );
        }
    }

    public async Task MarkNotificationAsReadAsync(long notificationId)
    {
        var notification = await _context.Notifications.FindAsync(notificationId);
        if (notification != null)
        {
            notification.MarkAsRead();
            await _context.SaveChangesAsync();
        }
    }

    public async Task MarkAllNotificationsAsReadAsync(long userId)
    {
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();

        foreach (var notification in notifications)
        {
            notification.MarkAsRead();
        }

        await _context.SaveChangesAsync();
    }

    public async Task<List<Notification>> GetUserNotificationsAsync(long userId, int page = 1, int pageSize = 20)
    {
        return await _context.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<int> GetUnreadNotificationCountAsync(long userId)
    {
        return await _context.Notifications
            .CountAsync(n => n.UserId == userId && !n.IsRead);
    }

    public async Task SendBulkNotificationAsync(List<long> userIds, string title, string message, NotificationType type)
    {
        var notifications = userIds.Select(userId => Notification.Create(
            title,
            message,
            type,
            userId
        )).ToList();

        _context.Notifications.AddRange(notifications);
        await _context.SaveChangesAsync();
    }
}
