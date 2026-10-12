namespace MohamedTransit.API.DTO.MOT.Request;

public class BlockStageRequest
{
    public long ShipmentId { get; set; }
    public long StageId { get; set; }
    public string Reason { get; set; } = string.Empty;
}

