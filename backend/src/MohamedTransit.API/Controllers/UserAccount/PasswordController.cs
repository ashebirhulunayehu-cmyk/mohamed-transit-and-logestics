
using Mapster;
using Microsoft.AspNetCore.Mvc;
using MohamedTransit.Application.Commands.UserAccount;
using MohamedTransit.Application.Handlers.UserAccount;
using MohamedTransit.API.DTO.User.Request;

namespace MohamedTransit.API.Controllers.UserAccount;

[ApiController]
[Route("api/v1/[controller]")]
public class PasswordController : BaseController
{
    [HttpPost("ChangePassword")]
    public async Task<IActionResult> ChangePassword([FromBody] PasswordRequest request)
    {
        var command = request.Adapt<ChangePasswordCommand>();
        var result = await _mediator.Send(command);
        return result.IsError ? HandleErrorResponse(result.Errors) : HandleSuccessResponse(result.Payload);
    }

    [HttpPost("ResetPassword")]
    public async Task<IActionResult> ResetPassword([FromBody] PasswordRequest request)
    {
        var command = request.Adapt<ResetPasswordCommand>();
        var result = await _mediator.Send(command);
        return result.IsError ? HandleErrorResponse(result.Errors) : HandleSuccessResponse(result.Payload);
    }
    [HttpPost("ForgotPassword")]
    public async Task<IActionResult> ForgotPassword(
        [FromBody] ForgotPasswordRequest request)
    {
        var command = request.Adapt<ForgotPasswordCommand>();

        var result = await _mediator.Send(command);

        return result.IsError
            ? HandleErrorResponse(result.Errors)
            : HandleSuccessResponse(result.Payload);
    }

}
