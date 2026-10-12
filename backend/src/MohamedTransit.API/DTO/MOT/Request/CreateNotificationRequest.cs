using MohamedTransit.Domain.Common;
namespace MohamedTransit.API.DTO.MOT.Request;

public class CreateNotificationRequest
{
    public long UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationType Type { get; set; }
    public long? ServiceId { get; set; }
}


