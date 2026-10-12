using System.ComponentModel.DataAnnotations;

namespace MohamedTransit.API.User.Request;

public class UpdateUserRequest
{
    public long Id { get; set; }
    public string FirstName { get; set; } = String.Empty;
    public string LastName { get; set; } = String.Empty;
    public string Email { get; set; } = String.Empty;
    public bool IsSuperAdmin { get; set; } = false;
    public string PhoneNumber { get; set; } = String.Empty;
    public List<long> Roles { get; set; }
}
