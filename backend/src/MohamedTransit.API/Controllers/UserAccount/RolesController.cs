using Mapster;

using MediatR;

using Microsoft.AspNetCore.Mvc;

using MohamedTransit.Application.Commands.UserAccount;
using MohamedTransit.Application.DTO;
using MohamedTransit.Application.Queries.UserAccount;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Entities;

// removed incorrect using

namespace MohamedTransit.API.Controllers.UserAccount;

[ApiController]
[Route("api/v1/[controller]")]
public class RolesController : BaseController
{
    // BaseController resolves IMediator from HttpContext.RequestServices, no constructor needed

    // =========================================================
    // CREATE ROLE
    // POST: api/v1/Roles/Create
    // =========================================================
    [HttpPost("Create")]
    public async Task<IActionResult> Create([FromBody] RoleDto clientRequest)
    {

        var privilegeIds = clientRequest.Privileges?.Select(p => p.Id).ToList() ?? new List<long>();

        // CreateRoleCommand expects (roleName, description, List<long> privilegeIds)
        var command = new CreateRoleCommand(
            clientRequest.RoleName,
            string.Empty,
            privilegeIds
        );
        var result = await _mediator.Send(command);

        if (result == null) return BadRequest("An unexpected error occurred.");

        if (result.IsError)
            return HandleErrorResponse(result.Errors);

        var roleDetail = result.Payload?.Adapt<RoleDto>();
        return HandleSuccessResponse(roleDetail);
    }

    // =========================================================
    // UPDATE ROLE
    // PUT: api/v1/Roles/Update
    // =========================================================
    [HttpPut("Update")]
    public async Task<IActionResult> Update([FromBody] RoleDto clientRequest)
    {
        var command = clientRequest.Adapt<UpdateRoleCommand>();
        var result = await _mediator.Send(command);

        if (result == null) return BadRequest("An unexpected error occurred.");

        if (result.IsError)
            return HandleErrorResponse(result.Errors);

        var roleDetail = result.Payload?.Adapt<RoleDto>();
        return HandleSuccessResponse(roleDetail);
    }

    // =========================================================
    // DELETE ROLE
    // DELETE: api/v1/Roles/Delete/5
    // =========================================================
    [HttpDelete("Delete/{id:long}")]
    public async Task<IActionResult> Delete(long id)
    {
        var result = await _mediator.Send(new DeleteRoleCommand(id));

        if (result == null) return BadRequest("An unexpected error occurred.");

        return result.IsError
            ? HandleErrorResponse(result.Errors)
            : HandleSuccessResponse(result);
    }

    // =========================================================
    // GET ALL ROLES
    // GET: api/v1/Roles/GetAll
    // =========================================================
    [HttpGet("GetAll")]
    public async Task<IActionResult> GetAll([FromQuery] RecordStatus? recordStatus)
    {
        var query = new GetAllRolesQuery { RecordStatus = recordStatus };
        var result = await _mediator.Send(query);

        if (result == null) return BadRequest("An unexpected error occurred.");

        if (result.IsError)
            return HandleErrorResponse(result.Errors);

        var rolesList = result.Payload?.Adapt<List<RoleDto>>();
        return HandleSuccessResponse(rolesList);
    }

    // =========================================================
    // GET ROLE BY ID
    // GET: api/v1/Roles/GetById/5
    // =========================================================
    [HttpGet("GetById/{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var query = new GetRoleById(id);
        var result = await _mediator.Send(query);

        if (result == null || result.Payload == null)
        {
            return HandleSuccessResponse(new RoleDto());
        }

        if (result.IsError)
            return HandleErrorResponse(result.Errors);

        var roleResult = result.Payload.Adapt<RoleDto>();
        var privilegeList = new List<PrivilegeDto>();

        if (result.Payload.RolePrivileges != null)
        {
            foreach (var item in result.Payload.RolePrivileges)
            {
                if (item.Privilege != null)
                {
                    privilegeList.Add(item.Privilege.Adapt<PrivilegeDto>());
                }
            }
        }

        roleResult.Privileges = privilegeList;

        return HandleSuccessResponse(roleResult);
    }
}
