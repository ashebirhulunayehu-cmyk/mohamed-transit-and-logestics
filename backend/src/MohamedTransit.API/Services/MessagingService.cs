using Microsoft.EntityFrameworkCore;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;
namespace MohamedTransit.API.Services;

public interface IMessagingService
{
    Task<ServiceMessage> SendMessageAsync(long serviceId, long senderId, string subject, string content, MessageType type, long? recipientId = null);
    Task<List<ServiceMessage>> GetServiceMessagesAsync(long serviceId, int page = 1, int pageSize = 20);
    Task<List<ServiceMessage>> GetUserMessagesAsync(long userId, int page = 1, int pageSize = 20);
    Task<ServiceMessage> GetMessageAsync(long messageId);
    Task MarkMessageAsReadAsync(long messageId, long userId);
    Task<List<ServiceMessage>> GetUnreadMessagesAsync(long userId);
    Task<int> GetUnreadMessageCountAsync(long userId);
    Task SendGroupMessageAsync(long serviceId, long senderId, string subject, string content, List<long> recipientIds);
}

public class MessagingService : IMessagingService
{
    private readonly ApplicationDbContext _context;
    private readonly INotificationService _notificationService;

    public MessagingService(ApplicationDbContext context, INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<ServiceMessage> SendMessageAsync(long serviceId, long senderId, string subject, string content, MessageType type, long? recipientId = null)
    {
        var message = ServiceMessage.Create(
            subject,
            content,
            type,
            serviceId,
            senderId,
            recipientId
        );

        _context.ServiceMessages.Add(message);
        await _context.SaveChangesAsync();

        // Send notification to recipient if specified
        if (recipientId.HasValue)
        {
            await _notificationService.CreateNotificationAsync(
                recipientId.Value,
                "New Message",
                $"You have a new message: {subject}",
                NotificationType.Message,
                serviceId
            );
        }

        return message;
    }

    public async Task<List<ServiceMessage>> GetServiceMessagesAsync(long serviceId, int page = 1, int pageSize = 20)
    {
        return await _context.ServiceMessages
            .Where(m => m.ServiceId == serviceId)
            .Include(m => m.SenderUser)
            .Include(m => m.RecipientUser)
            .OrderByDescending(m => m.CreatedDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<List<ServiceMessage>> GetUserMessagesAsync(long userId, int page = 1, int pageSize = 20)
    {
        return await _context.ServiceMessages
            .Where(m => m.SenderUserId == userId || m.RecipientUserId == userId)
            .Include(m => m.SenderUser)
            .Include(m => m.RecipientUser)
            .Include(m => m.Service)
            .OrderByDescending(m => m.CreatedDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<ServiceMessage> GetMessageAsync(long messageId)
    {
        return await _context.ServiceMessages
            .Include(m => m.SenderUser)
            .Include(m => m.RecipientUser)
            .Include(m => m.Service)
            .FirstOrDefaultAsync(m => m.Id == messageId);
    }

    public async Task MarkMessageAsReadAsync(long messageId, long userId)
    {
        var message = await _context.ServiceMessages
            .FirstOrDefaultAsync(m => m.Id == messageId && m.RecipientUserId == userId);

        if (message != null && !message.IsRead)
        {
            message.MarkAsRead();
            await _context.SaveChangesAsync();
        }
    }

    public async Task<List<ServiceMessage>> GetUnreadMessagesAsync(long userId)
    {
        return await _context.ServiceMessages
            .Where(m => m.RecipientUserId == userId && !m.IsRead)
            .Include(m => m.SenderUser)
            .Include(m => m.Service)
            .OrderByDescending(m => m.CreatedDate)
            .ToListAsync();
    }

    public async Task<int> GetUnreadMessageCountAsync(long userId)
    {
        return await _context.ServiceMessages
            .CountAsync(m => m.RecipientUserId == userId && !m.IsRead);
    }

    public async Task SendGroupMessageAsync(long serviceId, long senderId, string subject, string content, List<long> recipientIds)
    {
        var messages = recipientIds.Select(recipientId => ServiceMessage.Create(
            subject,
            content,
            MessageType.Group,
            serviceId,
            senderId,
            recipientId
        )).ToList();

        _context.ServiceMessages.AddRange(messages);
        await _context.SaveChangesAsync();

        // Send notifications to all recipients
        await _notificationService.SendBulkNotificationAsync(
            recipientIds,
            "New Group Message",
            $"You have a new group message: {subject}",
            NotificationType.Message
        );
    }
}
