using Mapster;

using MediatR;

using Microsoft.AspNetCore.Mvc;

using MohamedTransit.Application.Commands.UserAccount;
using MohamedTransit.Application.Queries.UserAccount;
using MohamedTransit.Domain.Common;

namespace MohamedTransit.API.Controllers.UserAccount;

[ApiController]
[Route("api/v1/[controller]")]
public class RolePrivilegeController : BaseController
{
    // BaseController ባዶ ኮንስትራክተር ስላለው base(mediator) አይጠራም
    // _mediator በ BaseController ውስጥ ይገኛል
    public RolePrivilegeController()
    {
    }

    // =========================================================
    // CREATE ROLE PRIVILEGE
    // POST: api/v1/RolePrivilege/Create
    // =========================================================
    [HttpPost("Create")]
    public async Task<IActionResult> Create([FromBody] AddRolePrivilege clientRequest)
    {
        var command = clientRequest.Adapt<AddRolePrivilege>();
        var result = await _mediator.Send(command);

        if (result == null) return BadRequest("An unexpected error occurred.");

        return result.IsError
            ? HandleErrorResponse(result.Errors)
            : HandleSuccessResponse(result.Payload!);
    }

    // =========================================================
    // GET ALL ROLE PRIVILEGES
    // GET: api/v1/RolePrivilege/GetAll
    // =========================================================
    [HttpGet("GetAll")]
    public async Task<IActionResult> GetAll([FromQuery] RecordStatus? recordStatus)
    {
        var query = new GetAllRolePrivilegesQuery { RecordStatus = recordStatus };
        var result = await _mediator.Send(query);

        if (result == null) return BadRequest("An unexpected error occurred.");

        if (result.IsError)
            return HandleErrorResponse(result.Errors);

        return HandleSuccessResponse(result.Payload!);
    }
}
