namespace MohamedTransit.API.DTO.MOT.Request;
public class AddStageCommentRequest
{
    public long ShipmentId { get; set; }
    public long StageId { get; set; }
    public string Comment { get; set; } = string.Empty;
    public string? CommentType { get; set; }
    public bool IsInternal { get; set; } = false;
    public bool IsVisibleToCustomer { get; set; } = true;
}

