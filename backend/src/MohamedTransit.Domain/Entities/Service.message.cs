using MohamedTransit.Domain;
using MohamedTransit.Domain.Common;

namespace MohamedTransit.Domain.Entities;

public class ServiceMessage : BaseEntity
{
    public string Subject { get; private set; } = string.Empty;
    public string Content { get; private set; } = string.Empty;
    public MessageType MessageType { get; private set; }
    public bool IsRead { get; private set; }
    public DateTime? ReadAt { get; private set; }
    public bool IsUrgent { get; private set; }
    public string? Priority { get; private set; }

    // የተጨመረው የCreatedDate ፕሮፐርቲ
    public DateTime CreatedDate { get; private set; } = DateTime.UtcNow;

    // Foreign Keys
    public long? ServiceId { get; private set; }
    public long? SenderUserId { get; private set; }
    public long? RecipientUserId { get; private set; }
    public long? ServiceStageId { get; private set; }

    // Navigation Properties
    public Shipment? Service { get; set; }
    public User? SenderUser { get; set; }
    public User? RecipientUser { get; set; }
    public ServiceStageExecution? ServiceStage { get; set; }

    public static ServiceMessage Create(
        string subject,
        string content,
        MessageType messageType,
        long serviceId,
        long senderUserId,
        long? recipientUserId = null,
        long? serviceStageId = null,
        bool isUrgent = false,
        string? priority = null)
    {
        return new ServiceMessage
        {
            Subject = subject,
            Content = content,
            MessageType = messageType,
            ServiceId = serviceId,
            SenderUserId = senderUserId,
            RecipientUserId = recipientUserId,
            ServiceStageId = serviceStageId,
            IsUrgent = isUrgent,
            Priority = priority,
            IsRead = false,
            CreatedDate = DateTime.UtcNow, // እዚህ ጋርም ማስጀመር ይቻላል
            RecordStatus = RecordStatus.Active
        };
    }

    public void MarkAsRead()
    {
        IsRead = true;
        ReadAt = DateTime.UtcNow;
        SetUpdated();
    }

    public void UpdateContent(string content)
    {
        Content = content;
        SetUpdated();
    }

    public void SetUrgent(bool isUrgent)
    {
        IsUrgent = isUrgent;
        SetUpdated();
    }
}
