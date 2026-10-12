using MohamedTransit.Domain.Common;

namespace MohamedTransit.API.DTO.MOT.Request;
public class UpdateStageStatusRequest
{
    public long ShipmentId { get; set; }
    public long StageId { get; set; }
    public StageStatus Status { get; set; }
    public string? Comments { get; set; }
}

