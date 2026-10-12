namespace MohamedTransit.Application.DTO;

public class PasswordRequest
{
    public string Password { get; set; } = string.Empty;

    // For change/reset
    public string NewPassword { get; set; } = string.Empty;

    // For forgot password flow
    public string Email { get; set; } = string.Empty;
}
