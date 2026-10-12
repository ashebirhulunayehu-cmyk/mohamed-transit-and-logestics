using MohamedTransit.Domain.Common;

namespace MohamedTransit.API.DTO.MOT.Request;

public class CreateCustomerServiceRequest
{
    public string Description { get; set; }
    public TransportMode Mode { get; set; } // ወይም string ከሆነ እንደ አቀራረብህ
    public string Origin { get; set; }
    public string Destination { get; set; }
}
