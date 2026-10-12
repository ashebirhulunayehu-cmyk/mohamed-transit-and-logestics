using System.Data;

using MediatR;

using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;

using MohamedTransit.Application.DTO;
using MohamedTransit.Application.Helper;
using MohamedTransit.Application.Service;
using MohamedTransit.Application.Commands.UserAccount;

namespace MohamedTransit.API.Filters
{
    public class AuthorizationHandler : IAuthorizationFilter
    {
        private readonly IMediator _mediator;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public AuthorizationHandler(TokenHandlerService tokenHandler, IHttpContextAccessor httpContextAccessor, IMediator mediator)
        {
            _mediator = mediator;
            _httpContextAccessor = httpContextAccessor;
        }
        private List<string> anonymous = new List<string>
        {
            "User-Login",
            "Password-ForgotPassword"
                };

        public List<string> Anonymous { get => anonymous; set => anonymous = value; }

        public void OnAuthorization(AuthorizationFilterContext context)
        {
            if (context != null && context?.ActionDescriptor is ControllerActionDescriptor descriptor)
            {
                //get api resource
                string apiClaim = String.Format("{0}-{1}", descriptor.ControllerName, descriptor.ActionName);
                var authHeader = context.HttpContext.Request.Headers["Authorization"].ToString();

                //get header values
                var clientToken = authHeader.Replace("Bearer ", "");

                if (!Anonymous.Contains(apiClaim))
                {
                    if (string.IsNullOrEmpty(clientToken))
                        context.Result = new UnauthorizedObjectResult(new { message = "Unauthorized" });
                    else
                    {
                        var isValidRequest = _mediator.Send(new ValidateUserCommand(clientToken.Trim(), apiClaim.Trim())).Result;
                        if (isValidRequest.IsError)
                            context.Result = new UnauthorizedObjectResult(HandleTokenErrorResponse(isValidRequest.Errors));
                        else
                        {
                            _httpContextAccessor?.HttpContext?.Session.SetString("user", isValidRequest.Payload.UserName);
                        }

                    }
                }

            }
        }
        protected OperationResult<UserTokenValidationResponse> HandleTokenErrorResponse(List<Error> errors)
        {
            var clientStatus = string.Empty;
            var apiError = new OperationResult<UserTokenValidationResponse>();
            clientStatus = errors.Any(x => x.Message == "User is not Authorized to access.") ? "104" : clientStatus;
            clientStatus = errors.Any(x => x.Message == "Id token is invalid.") ? "103" : clientStatus;
            clientStatus = errors.Any(x => x.Message == "Client is not Authorized.") ? "102" : clientStatus;
            clientStatus = errors.Any(x => x.Message == "Client token is invalid.") ? "101" : clientStatus;
            apiError.Message = clientStatus;
            errors.ForEach(e => apiError.AddError(ErrorCode.ServerError, e.Message));
            return apiError;
        }
    }
}

