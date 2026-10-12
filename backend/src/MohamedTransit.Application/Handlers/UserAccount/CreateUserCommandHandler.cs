using MediatR;

using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application.Commands.UserAccount;
using MohamedTransit.Application.Helper;
using MohamedTransit.Application.Service;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.Application.Handlers.UserAccount;

internal class CreateUserCommandHandler
    : IRequestHandler<CreateUserCommand, OperationResult<User>>
{
    private readonly ApplicationDbContext _context;
    private readonly PasswordService _passwordService;

    public CreateUserCommandHandler(
        ApplicationDbContext context,
        PasswordService passwordService)
    {
        _context = context;
        _passwordService = passwordService;
    }

    public async Task<OperationResult<User>> Handle(
        CreateUserCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Duplicate checks
        var existingUser = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.Username == request.Username ||
                     x.Email == request.Email,
                cancellationToken);

        if (existingUser != null)
        {
            return OperationResult<User>.Failure(
                "Username or email already exists.",
                ErrorCode.UserAlreadyExists);
        }

        // 2. Hash password during creation
        var hashedPassword = _passwordService.HashPassword(request.Password);

        var user = User.CreateUser(
            request.Username,
            request.Email,
            request.FirstName,
            request.LastName,
            request.ProfilePhoto,
            request.Phone,
            hashedPassword,
            request.IsSuperAdmin,
            AccountStatus.Approved);

        // 3. Attach Roles via Navigation Properties
        foreach (var roleId in request.Roles)
        {
            var userRole = new UserRole
            {
                User = user, // Pass entity reference so EF links IDs automatically on Save
                RoleId = roleId
            };
            user.AddRole(userRole);
        }

        // 4. Save User & Roles together
        await _context.Users.AddAsync(user, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return OperationResult<User>.Success(
            user,
            "User created successfully.");
    }
}
