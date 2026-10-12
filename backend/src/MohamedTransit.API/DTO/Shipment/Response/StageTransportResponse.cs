using MohamedTransit.Domain.Common;

namespace MohamedTransit.API;

public class StageTransportResponse
{
    public long Id { get; private set; }
    public string FullName { get; private set; } = string.Empty;
    public string? LicenceDocument { get; private set; }
    public string PlateNumber { get; private set; } = string.Empty;
    public string PhoneNumber { get; private set; } = string.Empty;
    public ProductAmount ProductAmount { get; private set; }
    public long? ServiceStageId { get; private set; }
}
