using System.Text.Json;

using MediatR;

using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application.Helper;
using MohamedTransit.Application.Service;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.Application.Commands.UserAccount;

// Record ከሚሆን ወደ Class ተቀይሯል፤ ይህም ከ Controller በኋላ ProfilePhoto እንድንቀይር ያስችለናል።
public class UpdateUserCommand : IRequest<OperationResult<User>>
{
    public long Id { get; set; }
    public RecordStatus? RecordStatus { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;

    // ፋይሉን ከ Front-end ለመቀበል
    public IFormFile? ProfileFile { get; set; }

    // የፋይሉ የተቀመጠበት ፓዝ (Path)
    public string ProfilePhoto { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public bool IsSuperAdmin { get; set; }
    public List<long> Roles { get; set; } = new();
    public long? OrganizationId { get; set; }
}

internal class UpdateUserCommandHandler : IRequestHandler<UpdateUserCommand, OperationResult<User>>
{
    private readonly ApplicationDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly TokenHandlerService _tokenHandlerService;

    public UpdateUserCommandHandler(
        ApplicationDbContext context,
        IHttpContextAccessor httpContextAccessor,
        TokenHandlerService tokenHandlerService)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
        _tokenHandlerService = tokenHandlerService;
    }

    public async Task<OperationResult<User>> Handle(UpdateUserCommand request, CancellationToken cancellationToken)
    {
        var result = new OperationResult<User>();

        try
        {
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

            if (existingUser is null)
            {
                result.AddError(ErrorCode.NotFound, "User Not exist.");
                return result;
            }

            // የተጠቃሚውን መረጃ ማሻሻል
            existingUser.UpdateUser(
                request.FirstName,
                request.LastName,
                request.ProfilePhoto,
                request.Phone,
                existingUser.IsSuperAdmin,
                request.UserName,
                request.Email,
                request.RecordStatus ?? RecordStatus.Active,
                AccountStatus.Approved
            );

            _context.Users.Update(existingUser);

            // ነባር UserRoles ማጽዳት
            var existingUserRoles = await _context.UserRoles
                .Where(r => r.UserId == request.Id)
                .ToListAsync(cancellationToken);

            _context.UserRoles.RemoveRange(existingUserRoles);
            await _context.SaveChangesAsync(cancellationToken);

            // አዳዲስ Roles ማያያዝ
            if (request.Roles != null && request.Roles.Count > 0)
            {
                foreach (var roleId in request.Roles)
                {
                    existingUser.AddRole(new UserRole
                    {
                        RoleId = roleId,
                        UserId = existingUser.Id
                    });
                }
                await _context.SaveChangesAsync(cancellationToken);
            }

            result.Payload = existingUser;
            result.Message = "Operation success";
            return result;
        }
        catch (Exception ex)
        {
            result.AddError(ErrorCode.ServerError, ex.Message);
        }

        return result;
    }
}
