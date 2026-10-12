using MohamedTransit.Domain.Common;
namespace MohamedTransit.API.DTO.MOT.Request;

public class BulkNotificationRequest
{
    public List<long> UserIds { get; set; } = new();
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationType Type { get; set; }
}


