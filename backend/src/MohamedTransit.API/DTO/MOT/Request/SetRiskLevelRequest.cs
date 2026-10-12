using MohamedTransit.Domain.Common;
namespace MohamedTransit.API.DTO.MOT.Request;

public class SetRiskLevelRequest
{
    public long ShipmentId { get; set; }
    public RiskLevel RiskLevel { get; set; }
    public string? RiskNotes { get; set; }
}

