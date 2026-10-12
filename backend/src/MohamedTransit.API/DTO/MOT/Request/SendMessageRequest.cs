using MohamedTransit.Domain.Common;
namespace MohamedTransit.API.DTO.MOT.Request;
public class SendMessageRequest
{
    public long ShipmentId { get; set; }
    public long? RecipientId { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public MessageType Type { get; set; }
}


