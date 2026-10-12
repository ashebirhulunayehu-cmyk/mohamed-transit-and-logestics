using MohamedTransit.Domain.Common;


namespace MohamedTransit.API;

public class UpdateStageTransportRequest
{
    public long Id { get; private set; }
    public string FullName { get; set; } = string.Empty;
    public string? LicenceDocument { get; set; }
    public IFormFile LicenceDocumentImage { get; set; }
    public string PlateNumber { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public ProductAmount ProductAmount { get; set; }
    public long? ServiceStageId { get; set; }
}
