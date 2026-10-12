using MohamedTransit.Domain.Common;
namespace MohamedTransit.API.DTO.Shipment.Request;

public class UpdateShipmentRequest
{
    public long Id { get; set; }
    public string ItemDescription { get; set; } = string.Empty;
    public string RouteCategory { get; set; } = string.Empty;
    public decimal DeclaredValue { get; set; }
    public string TaxCategory { get; set; } = string.Empty;
    public string CountryOfOrigin { get; set; } = string.Empty;
    public RiskLevel? RiskLevel { get; set; }
}

