using System.Net;

using Mapster;

using MediatR;

using Microsoft.AspNetCore.Mvc;

using MohamedTransit.Application.DTO;
using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Common;

namespace MohamedTransit.API.Controllers;

[Route("api/v1/[controller]")]
[ApiController]
public class BaseController : ControllerBase
{
    private IMediator? _mediatorInstance;

    protected IMediator _mediator =>
        _mediatorInstance ??= HttpContext.RequestServices.GetRequiredService<IMediator>();

    protected IActionResult HandleSuccessResponse<T>(T data, string message = "Operation Success")
    {
        Response.Headers["Cache-Control"] = "no-store, no-cache, max-age=0, must-revalidate";
        Response.Headers["Pragma"] = "no-cache";
        GetHeaders()["Expires"] = "0";

        var apiResponse = new ApiResponse<T>
        {
            Error = false,
            StatusCode = (int)HttpStatusCode.OK,
            Response = new Response<T>
            {
                Data = data
            },
            Message = message
        };

        return Ok(apiResponse);
    }

    private IHeaderDictionary GetHeaders()
    {
        return Response.Headers;
    }

    protected IActionResult HandleErrorResponse<T>(T data, ErrorCode code, string message)
    {
        var statusCode = GetHttpStatusCode(code);
        var apiResponse = new ApiResponse<T>
        {
            Error = true,
            StatusCode = statusCode,
            Response = new Response<T>
            {
                Data = data
            },
            Message = message
        };

        return StatusCode(statusCode, apiResponse);
    }

    protected IActionResult HandleErrorResponse<T>(T data)
    {
        var errors = data.Adapt<List<Error>>();

        if (errors.Count == 0)
        {
            errors.Add(new Error
            {
                Code = ErrorCode.ServerError,
                Message = "An error occurred while processing your request."
            });
        }

        var error = errors.FirstOrDefault(e => e.Code == ErrorCode.NotFound)
            ?? errors.FirstOrDefault(e => e.Code == ErrorCode.UnAuthorized)
            ?? errors[0];
        var statusCode = GetHttpStatusCode(error.Code);
        var apiResponse = new ApiResponse<T>();

        apiResponse.Error = true;
        apiResponse.Errors.Add(error.Message);
        apiResponse.StatusCode = statusCode;
        apiResponse.Response = null;
        apiResponse.Message = error.Message;

        return StatusCode(statusCode, apiResponse);
    }

    private static int GetHttpStatusCode(ErrorCode code) =>
        code switch
        {
            ErrorCode.UnAuthorized or ErrorCode.UserDoesNotExist or ErrorCode.IncorrectPassword =>
                (int)HttpStatusCode.Unauthorized,
            ErrorCode.NotFound => (int)HttpStatusCode.NotFound,
            ErrorCode.RecordFound or ErrorCode.UserAlreadyExists =>
                (int)HttpStatusCode.Conflict,
            ErrorCode.ServerError or ErrorCode.UnknownError =>
                (int)HttpStatusCode.InternalServerError,
            _ => (int)HttpStatusCode.BadRequest
        };

    protected IActionResult HandleTokenErrorResponse(List<Error> errors)
    {
        var clientStatus = string.Empty;
        var apiError = new OperationResult<UserTokenValidationResponse>();

        if (errors.Any(e => e.Code == ErrorCode.ServerError))
        {
            apiError.Message = "Server error";
            apiError.AddError(ErrorCode.ServerError, "Server error");
            return StatusCode((int)HttpStatusCode.InternalServerError, apiError);
        }

        clientStatus = errors.Any(x => x.Message == "User is not Authorized to access.") ? "104" : clientStatus;
        clientStatus = errors.Any(x => x.Message == "Id token is invalid.") ? "103" : clientStatus;
        clientStatus = errors.Any(x => x.Message == "Client is not Authorized.") ? "102" : clientStatus;
        clientStatus = errors.Any(x => x.Message == "Client token is invalid.") ? "101" : clientStatus;

        apiError.Message = clientStatus;
        errors.ForEach(e => apiError.AddError(ErrorCode.ServerError, e.Message));

        return StatusCode((int)HttpStatusCode.Unauthorized, apiError);
    }
}
