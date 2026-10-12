using MohamedTransit.Domain.Common;
namespace MohamedTransit.Domain.Entities;

public class User
{
    public long Id { get; set; }

    public string Username { get; private set; } = string.Empty;

    public string Email { get; private set; } = string.Empty;

    public string FirstName { get; private set; } = string.Empty;

    public string LastName { get; private set; } = string.Empty;

    public string ProfilePhoto { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string Password { get; private set; } = string.Empty;

    public bool IsSuperAdmin { get; private set; }

    public bool IsAccountLocked { get; private set; }

    public string VerificationToken { get; private set; } = string.Empty;

    public int LoginAttemptCount { get; private set; }

    public DateTime LastLoginDateTime { get; private set; }

    public bool IsConfirmationEmailSent { get; private set; }

    public int UserTokenLifetime { get; private set; } = 7200;

    public string RefreshToken { get; set; } = string.Empty;

    public DateTime RefreshTokenExpireDate { get; set; }

    public RecordStatus RecordStatus { get; private set; }

    public AccountStatus AccountStatus { get; private set; }

    private readonly List<UserRole> _roles = new();

    public ICollection<UserRole> UserRoles => _roles;

    public static User CreateUser(
        string username,
        string email,
        string firstName,
        string lastName,
        string profilePhoto,
        string phone,
        string password,
        bool isSuperAdmin,
        AccountStatus accountStatus)
    {
        return new User
        {
            Username = username,
            Email = email,
            FirstName = firstName,
            LastName = lastName,
            ProfilePhoto = profilePhoto,
            Phone = phone,
            Password = password,
            IsSuperAdmin = isSuperAdmin,
            RecordStatus = RecordStatus.Active,
            AccountStatus = accountStatus
        };
    }

    public void UpdatePassword(string password)
    {
        Password = password;
    }

    public void AddRole(UserRole role)
    {
        _roles.Add(role);
    }
    public void UpdateProfilePhoto(string profilePhotoPath)
    {
        ProfilePhoto = profilePhotoPath;
    }
    public void UpdateUser(
        string firstName,
        string lastName,
        string profilePhoto,
        string phone,
        bool isSuperAdmin,
        string username,
        string email,
        RecordStatus recordStatus,
        AccountStatus accountStatus)
    {
        FirstName = firstName;
        LastName = lastName;
        ProfilePhoto = profilePhoto;
        Phone = phone;
        IsSuperAdmin = isSuperAdmin;
        Username = username;
        Email = email;
        RecordStatus = recordStatus;
        AccountStatus = accountStatus;
    }
public void UpdateRefreshToken(string refreshToken, DateTime expireDate)
    {
        RefreshToken = refreshToken;
        RefreshTokenExpireDate = expireDate;
    }
    public void UpdateStatus(RecordStatus recordStatus)
    {
        RecordStatus = recordStatus;
    }

}
