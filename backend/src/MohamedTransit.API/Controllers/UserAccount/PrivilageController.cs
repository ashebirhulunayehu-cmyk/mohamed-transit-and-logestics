using System.Reflection;

using Mapster;

using MediatR;

using Microsoft.AspNetCore.Mvc;

using MohamedTransit.Application.Commands.UserAccount;
using MohamedTransit.Application.DTO;
using MohamedTransit.Application.Queries.UserAccount;
using MohamedTransit.Domain.Common;

namespace MohamedTransit.API.Controllers.UserAccount;

[ApiController]
[Route("api/v1/[controller]")]
public class PrivilegeController : BaseController
{
    // =========================================================
    // CREATE PRIVILEGE
    // POST: api/v1/Privilege/Create
    // =========================================================
    [HttpPost("Create")]
    public async Task<IActionResult> Create([FromBody] PrivilegeDto request)
    {
        var command = request.Adapt<CreatePrivilegeCommand>();
        var result = await _mediator.Send(command);

        if (result == null) return BadRequest("An unexpected error occurred.");

        if (result.IsError)
            return HandleErrorResponse(result.Errors);

        var privilegeDetail = result.Payload?.Adapt<PrivilegeDto>();
        return HandleSuccessResponse(privilegeDetail!);
    }

    // =========================================================
    // UPDATE PRIVILEGE
    // PUT: api/v1/Privilege/Update
    // =========================================================
    [HttpPut("Update")]
    public async Task<IActionResult> Update([FromBody] PrivilegeDto request)
    {
        var command = request.Adapt<UpdatePrivilegeCommand>();
        var result = await _mediator.Send(command);

        if (result == null) return BadRequest("An unexpected error occurred.");

        if (result.IsError)
            return HandleErrorResponse(result.Errors);

        var privilegeDetail = result.Payload?.Adapt<PrivilegeDto>();
        return HandleSuccessResponse(privilegeDetail!);
    }

    // =========================================================
    // DELETE PRIVILEGE
    // DELETE: api/v1/Privilege/Delete/5
    // =========================================================
    [HttpDelete("Delete/{id:long}")]
    public async Task<IActionResult> Delete(long id)
    {
        var result = await _mediator.Send(new DeletePrivilegeCommand(id));

        if (result == null) return BadRequest("An unexpected error occurred.");

        return result.IsError
            ? HandleErrorResponse(result.Errors)
            : HandleSuccessResponse(result);
    }

    // =========================================================
    // GET ALL PRIVILEGES
    // GET: api/v1/Privilege/GetAll
    // =========================================================
    [HttpGet("GetAll")]
    public async Task<IActionResult> GetAll([FromQuery] RecordStatus? recordStatus)
    {
        var query = new GetAllPrivilegesQuery { RecordStatus = recordStatus };
        var result = await _mediator.Send(query);

        if (result == null) return BadRequest("An unexpected error occurred.");

        if (result.IsError)
            return HandleErrorResponse(result.Errors);

        var privilegeList = result.Payload?.Adapt<List<PrivilegeDto>>();
        return HandleSuccessResponse(privilegeList!);
    }

    // =========================================================
    // GET PRIVILEGES BY ROLE ID
    // GET: api/v1/Privilege/GetByRoleId/5
    // =========================================================
    [HttpGet("GetByRoleId/{roleId:long}")]
    public async Task<IActionResult> GetByRoleId(long roleId)
    {
        var query = new GetPrivilegeByRoleQuery(roleId);
        var result = await _mediator.Send(query);

        if (result == null) return BadRequest("An unexpected error occurred.");

        if (result.IsError)
            return HandleErrorResponse(result.Errors);

        var privilegeList = result.Payload?.Adapt<List<PrivilegeDto>>();
        return HandleSuccessResponse(privilegeList!);
    }

    // =========================================================
    // GET PRIVILEGE BY ID
    // GET: api/v1/Privilege/GetById/5
    // =========================================================
    [HttpGet("GetById/{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var query = new GetPrivilegeById(id);
        var result = await _mediator.Send(query);

        if (result == null || result.Payload == null)
            return HandleSuccessResponse(new PrivilegeDto());

        if (result.IsError)
            return HandleErrorResponse(result.Errors);

        var privilegeDetail = result.Payload.Adapt<PrivilegeDto>();
        return HandleSuccessResponse(privilegeDetail);
    }

    // =========================================================
    // SEED PRIVILEGES (REFLECTION)
    // POST: api/v1/Privilege/SeedPrivileges
    // =========================================================
    [HttpPost("SeedPrivileges")]
    public async Task<IActionResult> SeedPrivileges()
    {
        var privileges = new List<PrivilegeDto>();
        Assembly asm = Assembly.GetExecutingAssembly();

        var controlleractionlist = asm.GetTypes()
            .Where(type => typeof(ControllerBase).IsAssignableFrom(type))
            .SelectMany(type => type.GetMethods(BindingFlags.Instance | BindingFlags.DeclaredOnly | BindingFlags.Public))
            .Where(m => !m.GetCustomAttributes(typeof(System.Runtime.CompilerServices.CompilerGeneratedAttribute), true).Any())
            .Select(x => new
            {
                Controller = x.DeclaringType != null ? x.DeclaringType.Name : string.Empty,
                Action = x.Name
            })
            .OrderBy(x => x.Controller)
            .ThenBy(x => x.Action)
            .ToList();

        foreach (var item in controlleractionlist)
        {
            var privilege = new PrivilegeDto
            {
                Action = item.Controller.Replace("Controller", "") + "-" + item.Action,
                Description = item.Controller.Replace("Controller", "")
            };
            privileges.Add(privilege);
        }

        var command = new MohamedTransit.Application.Commands.UserAccount.PrivilegeSeeder(privileges);
        var result = await _mediator.Send(command);

        if (result == null) return BadRequest("An unexpected error occurred.");

        return result.IsError
            ? HandleErrorResponse(result.Errors)
            : HandleSuccessResponse(result);
    }
}
