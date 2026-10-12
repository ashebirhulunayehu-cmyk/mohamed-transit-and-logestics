using System.ComponentModel.DataAnnotations;
using MohamedTransit.Domain.Common;
namespace MohamedTransit.API.DTO.User.Request;
public class PrivilegeRequest
{
  public long Id { get; set; }
    [Required]
    public string Action { get; set; } = string.Empty;
    [Required]
    public string Description { get; set; } = string.Empty;
public RecordStatus? RecordStatus { get; set; }

}
