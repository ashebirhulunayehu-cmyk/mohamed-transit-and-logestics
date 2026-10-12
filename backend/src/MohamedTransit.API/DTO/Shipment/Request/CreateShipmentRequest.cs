using MohamedTransit.Domain;
using MohamedTransit.Domain.Common;

namespace MohamedTransit.API.DTO.Shipment.Request;

public class CreateShipmentRequest
{
    public long ImporterId { get; set; }
    public long CreatedByUserId { get; set; }
    public string Description { get; set; } = string.Empty;
    public TransportMode Mode { get; set; }
    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
}
