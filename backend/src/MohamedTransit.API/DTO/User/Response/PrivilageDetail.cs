using MohamedTransit.Domain.Common;
namespace MohamedTransit.API.DTO.User.Response;

public class PrivilegeDetail
{
    public long Id { get; set; }
    public string Action { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public RecordStatus RecordStatus { get; set; }
}
