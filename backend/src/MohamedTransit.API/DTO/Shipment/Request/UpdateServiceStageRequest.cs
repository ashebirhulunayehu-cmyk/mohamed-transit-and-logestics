using MohamedTransit.Domain.Common;

namespace MohamedTransit.API.DTO.Shipment.Request;

public class UpdateServiceStageRequest
{
    public long ShipmentStageId { get; set; }
    public long ShipmentId { get; set; }
    public StageStatus Status { get; set; }
    public string? Notes { get; set; }
}
