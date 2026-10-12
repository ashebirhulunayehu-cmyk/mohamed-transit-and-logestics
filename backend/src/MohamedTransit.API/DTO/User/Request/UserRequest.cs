using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

using MohamedTransit.Domain.Common;


namespace MohamedTransit.API.DTO.User.Request;

public class UserRequest
{
    [Required]
    [MinLength(3)]
    public string Username { get; set; } = string.Empty;
    [Required]
    [MinLength(3)]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    [Required]
    [MinLength(3)]
    public string FirstName { get; set; } = string.Empty;
    [Required]
    [MinLength(3)]
    public string LastName { get; set; } = string.Empty;
    /// <summary>
    /// Gets or sets the logo file to be uploaded for the landlord.
    /// </summary>
    [Required]
    public IFormFile ProfileFile { get; set; } = default!; // For file upload

    /// <summary>
    /// Gets or sets the path where the logo will be saved, not to be set by the client.
    /// </summary>
    [JsonIgnore]
    public string? ProfilePhoto { get; set; } // For the path after saving, server-side only
    public string Phone { get; set; } = string.Empty;
    [Required]
    [MinLength(8)]
    public string Password { get; set; } = string.Empty;

    public bool? IsSuperAdmin { get; set; } = false;
    public List<long>? Roles { get; set; } = new List<long>();
}

public class UpdateUserRequest
{
    public long Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;

    public IFormFile? ProfileFile { get; set; }

    /// <summary>
    /// Gets or sets the path where the logo will be saved, not to be set by the client.
    /// </summary>
    [JsonIgnore]
    public string? ProfilePhoto { get; set; } // For the path after saving, server-side only
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public RecordStatus? RecordStatus { get; set; }
    public bool? IsSuperAdmin { get; set; }
    public List<long>? Roles { get; set; } = new List<long>();
}
