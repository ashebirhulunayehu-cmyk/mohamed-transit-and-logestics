namespace MohamedTransit.API.DTO.User.Request;

public class ResetPasswordRequest
{
    public string UserName { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

