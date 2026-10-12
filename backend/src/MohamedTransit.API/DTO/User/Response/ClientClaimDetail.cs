using MohamedTransit.Domain.Common;

namespace MohamedTransit.API.DTO.User.Response;

public class ClientClaimDetail
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Claim { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public long ClientId { get; set; }
    public RecordStatus RecordStatus { get; set; }
}

