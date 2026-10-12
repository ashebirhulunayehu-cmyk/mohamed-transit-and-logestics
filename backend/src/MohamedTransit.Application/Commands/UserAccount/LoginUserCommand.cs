using MediatR;

using MohamedTransit.Application.DTO;

using MohamedTransit.Application.Helper;

namespace MohamedTransit.Application.Commands.UserAccount;

public class LoginUserCommand
    : IRequest<OperationResult<UserLoginDto>>
{
    public string UserName { get; set; } = string.Empty;

    // Allow login using email as an alternative identifier
    public string Email { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;
}
