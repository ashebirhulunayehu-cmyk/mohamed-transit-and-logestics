using System.Text.Json;

using MediatR;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using MohamedTransit.API.Services; // IFileStorageService ያለበት namespace
using MohamedTransit.Application.Commands.UserAccount;
using MohamedTransit.Application.Queries.UserAccount;
using MohamedTransit.Application.Service;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;

namespace MohamedTransit.API.Controllers.UserAccount;

[ApiController]
[Route("api/v1/[controller]")]
public class UserController : BaseController
{
    private readonly ApplicationDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly TokenHandlerService _tokenHandlerService;
    private readonly IFileStorageService _fileStorageService;

    public UserController(
        ApplicationDbContext context,
        IHttpContextAccessor httpContextAccessor,
        TokenHandlerService tokenHandlerService,
        IFileStorageService fileStorageService)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
        _tokenHandlerService = tokenHandlerService;
        _fileStorageService = fileStorageService;
    }
    [HttpPost("Create")]
    public async Task<IActionResult> Create([FromForm] CreateUserCommand clientRequest)
    {
        if (clientRequest.ProfileFile == null || clientRequest.ProfileFile.Length == 0)
        {
            return BadRequest(new
            {
                Error = true,
                Message = "Photo file is required."
            });
        }

        try
        {
            var photoPath = await _fileStorageService.SaveFileAsync(clientRequest.ProfileFile, "Profile_Photo");
            clientRequest.ProfilePhoto = photoPath;
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                Error = true,
                Message = ex.Message
            });
        }

        var result = await _mediator.Send(clientRequest);

        if (result == null) return BadRequest("An unexpected error occurred.");
        if (result.IsError)
        {
            return HandleErrorResponse(result.Errors ?? new());
        }

        return HandleSuccessResponse(result.Payload, "User created successfully");
    }


    // =========================================================
    // DB TEST
    // =========================================================
    [HttpGet("db-test")]
    public async Task<IActionResult> DbTest()
    {
        try
        {
            var count = await _context.Users.CountAsync();
            return Ok($"Connected to Database! Users count: {count}");
        }
        catch (Exception ex)
        {
            return BadRequest($"DB error: {ex.Message}");
        }
    }

    // =========================================================
    // UPDATE USER
    // =========================================================
    [HttpPut("Update")]
    public async Task<IActionResult> Update([FromForm] UpdateUserCommand clientRequest)
    {
        var userName = GetCurrentUserName();

        var currentUser = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(x => x.Username == userName);

        if (currentUser == null)
        {
            return Unauthorized("User not found.");
        }

        bool isAdmin = currentUser.UserRoles?.Any(r => r.Role != null && r.Role.Name == "Admin") ?? false;

        if (!isAdmin && clientRequest.Id != currentUser.Id)
        {
            return StatusCode(StatusCodes.Status403Forbidden, "You are not allowed to update other users.");
        }

        var existingUser = await _context.Users.FirstOrDefaultAsync(x => x.Id == clientRequest.Id);

        if (existingUser == null)
        {
            return NotFound("User not found.");
        }

        string profilePhoto = existingUser.ProfilePhoto;

        if (clientRequest.ProfileFile != null && clientRequest.ProfileFile.Length > 0)
        {
            
            if (!string.IsNullOrEmpty(existingUser.ProfilePhoto))
            {
                await _fileStorageService.DeleteFileAsync(existingUser.ProfilePhoto);
            }

            profilePhoto = await _fileStorageService.SaveFileAsync(clientRequest.ProfileFile, "Profile_Photo");
        }

        clientRequest.ProfilePhoto = profilePhoto;

        var result = await _mediator.Send(clientRequest);

        if (result == null) return BadRequest("An unexpected error occurred.");

        return result.IsError
            ? HandleErrorResponse(result.Errors ?? new())
            : HandleSuccessResponse(result.Payload!);
    }

    // =========================================================
    // DELETE USER
    // =========================================================
    [HttpDelete("Delete/{id:long}")]
    public async Task<IActionResult> Delete(long id)
    {
        var command = new DeleteUserCommand(id);
        var result = await _mediator.Send(command);

        if (result == null) return BadRequest("An unexpected error occurred.");

        if (result.IsError)
        {
            return HandleErrorResponse(result.Errors ?? new());
        }

        return Ok(result);
   }

    // =========================================================
    // LOGIN
    // =========================================================
    [HttpPost("Login")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> Login([FromBody] LoginUserCommand command)
    {
        var result = await _mediator.Send(command);

        if (result == null) return BadRequest("An unexpected error occurred.");

        return result.IsError
            ? HandleErrorResponse(result.Errors ?? new())
            : HandleSuccessResponse(result.Payload!);
    }

    // =========================================================
    // LOGOUT
    // =========================================================
    [HttpPost("LogOut")]
    public IActionResult LogOut([FromBody] JsonElement tokenBody)
    {
        string? token = null;
        if (tokenBody.ValueKind == JsonValueKind.String)
        {
            token = tokenBody.GetString();
        }
        else if (tokenBody.ValueKind == JsonValueKind.Object && tokenBody.TryGetProperty("token", out var t))
        {
            token = t.ValueKind == JsonValueKind.String ? t.GetString() : null;
        }

        return HandleSuccessResponse(new { Message = "Log out Successfully" });
    }

    // =========================================================
    // GET ALL USERS
    // =========================================================
    [HttpGet("GetAll")]
    public async Task<IActionResult> GetAll([FromQuery] RecordStatus recordStatus)
    {
        var query = new GetAllUsersQuery { RecordStatus = recordStatus };
        var result = await _mediator.Send(query);

        if (result == null) return BadRequest("An unexpected error occurred.");

        if (!result.IsError)
        {
            return HandleSuccessResponse(result.Payload, "Users retrieved successfully");
        }

        return BadRequest(result);
    }

    // =========================================================
    // GET USER BY ID
    // =========================================================
    [HttpGet("GetById/{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var query = new GetUserById(id);
        var result = await _mediator.Send(query);

        if (result == null || result.Payload == null)
        {
            return HandleSuccessResponse(new List<object>());
        }

        return result.IsError
            ? HandleErrorResponse(result.Errors ?? new())
            : HandleSuccessResponse(result.Payload);
    }

    // =========================================================
    // REFRESH TOKEN
    // =========================================================
    [HttpPost("RefreshToken")]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenCommand command)
    {
        var result = await _mediator.Send(command);

        if (result == null) return BadRequest("An unexpected error occurred.");

        return result.IsError
            ? HandleErrorResponse(result.Errors ?? new())
            : HandleSuccessResponse(result);
    }

    // =========================================================
    // HELPER METHOD
    // =========================================================
    private string? GetCurrentUserName()
    {
        var authorizationHeader = _httpContextAccessor.HttpContext?.Request.Headers["Authorization"].ToString();
        if (string.IsNullOrEmpty(authorizationHeader) || !authorizationHeader.StartsWith("Bearer "))
        {
            return null;
        }

        var token = authorizationHeader.Substring("Bearer ".Length).Trim();
        var claims = _tokenHandlerService.GetClaims(token);

        var userNameClaim = claims?.FirstOrDefault(c => c.Type == "userName");
        return userNameClaim?.Value;
    }
}
