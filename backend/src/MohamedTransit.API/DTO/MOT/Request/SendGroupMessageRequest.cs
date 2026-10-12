namespace MohamedTransit.API.DTO.MOT.Request;

public class SendGroupMessageRequest
{
    public long ShipmentId { get; set; }
    public long SenderId { get; set; }
    public List<long> RecipientIds { get; set; } = new();
    public string Subject { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
}


