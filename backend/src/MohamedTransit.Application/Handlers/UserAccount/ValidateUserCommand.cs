using System.Security.Claims;
using MediatR;
using MohamedTransit.Application.DTO;
using MohamedTransit.Application.Helper;
using MohamedTransit.Application.Service;

namespace MohamedTransit.Application.Commands.UserAccount;

public record ValidateUserCommand(string AccessToken, string ApiResource) : IRequest<OperationResult<UserTokenValidationResponse>>;

internal class ValidateUserCommandHandler : IRequestHandler<ValidateUserCommand, OperationResult<UserTokenValidationResponse>>
{
    private readonly TokenHandlerService _tokenService;

    public ValidateUserCommandHandler(TokenHandlerService tokenService)
    {
        _tokenService = tokenService;
    }

    public Task<OperationResult<UserTokenValidationResponse>> Handle(ValidateUserCommand request, CancellationToken cancellationToken)
    {
        var result = new OperationResult<UserTokenValidationResponse>();

        if (string.IsNullOrWhiteSpace(request.AccessToken) || !_tokenService.ValidateToken(request.AccessToken))
        {
            result.AddError(ErrorCode.UnAuthorized, "Invalid or expired token.");
            return Task.FromResult(result);
        }

        var claims = _tokenService.GetClaims(request.AccessToken);
        var userNameClaim = claims?.FirstOrDefault(c => c.Type == "userName")?.Value ?? string.Empty;

        result.Payload = new UserTokenValidationResponse { UserName = userNameClaim };
        result.Message = "Token validated";
        return Task.FromResult(result);
    }
}
