using MediatR;

using MohamedTransit.Application.Helper;

using MohamedTransit.Domain.Entities;
using MohamedTransit.Domain.Common;

namespace MohamedTransit.Application;

public class UpdateShipmentCommand : IRequest<OperationResult<Shipment>>
{
    public long Id { get; set; }
    public string ItemDescription { get; set; } = string.Empty;
    public string RouteCategory { get; set; } = string.Empty;
    public decimal DeclaredValue { get; set; }
    public string TaxCategory { get; set; } = string.Empty;
    public string CountryOfOrigin { get; set; } = string.Empty;
    public RiskLevel? RiskLevel { get; set; }
}

