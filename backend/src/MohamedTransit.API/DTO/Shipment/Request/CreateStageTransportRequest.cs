using MohamedTransit.Domain.Common;


namespace MohamedTransit.API;

public class CreateStageTransportRequest
{
    public string FullName { get; private set; } = string.Empty;
    public string? LicenceDocument { get; set; }
    public IFormFile LicenceDocumentImage { get; set; }
    public string PlateNumber { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public ProductAmount ProductAmount { get; set; }
    public long? ServiceStageId { get; set; }
}
