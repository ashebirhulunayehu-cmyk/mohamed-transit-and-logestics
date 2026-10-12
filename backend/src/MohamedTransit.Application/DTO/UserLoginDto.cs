namespace MohamedTransit.Application.DTO;

public class UserLoginDto
{
    public UserLoginDto()
    {
        Roles = new List<RoleDto>();
    }

    public UserLoginDto(
        string userName,
        string email,
        string firstName,
        string lastName,
        string phone,
        string profilePhoto)
    {
        Username = userName;
        Email = email;
        FirstName = firstName;
        LastName = lastName;
        Phone = phone;
        ProfilePhoto = profilePhoto;
        Roles = new List<RoleDto>();
    }

    public long Id { get; set; }

    public string Username { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string ProfilePhoto { get; set; } = string.Empty;

    public string AccessToken { get; set; } = string.Empty;

    public string RefreshToken { get; set; } = string.Empty;

    public List<RoleDto> Roles { get; set; }
}

public class RoleDto
{
    public long Id { get; set; }

    public string RoleName { get; set; } = string.Empty;

    public List<PrivilegeDto> Privileges { get; set; } = new();
}

public class PrivilegeDto
{
    public long Id { get; set; }

    public string Action { get; set; } = string.Empty;


    public string Description { get; set; } = string.Empty;
}
