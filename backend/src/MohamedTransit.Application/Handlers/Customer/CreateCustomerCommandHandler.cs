using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using MohamedTransit.Application.Helper;
using MohamedTransit.Application.Service;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;
namespace MohamedTransit.Application.Handlers.Customer;
internal class CreateCustomerCommandHandler : IRequestHandler<CreateCustomerCommand, OperationResult<User>>
{
    private readonly ApplicationDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly TokenHandlerService _tokenHandlerService;

    public CreateCustomerCommandHandler(
        ApplicationDbContext context,
        IHttpContextAccessor httpContextAccessor,
        TokenHandlerService tokenHandlerService)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
        _tokenHandlerService = tokenHandlerService;
    }

    public async Task<OperationResult<User>> Handle(CreateCustomerCommand request, CancellationToken cancellationToken)
    {
        var result = new OperationResult<User>();

        var userName = GetCurrentUserName();
        long userId = 0;
        if (!string.IsNullOrEmpty(userName))
        {
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(x => x.Username == userName, cancellationToken);
            if (existingUser != null)
            {
                userId = existingUser.Id;
            }
        }

      
        var user = await _context.Users.FirstOrDefaultAsync(x => x.Id == request.UserId, cancellationToken);
        if (user == null)
        {
            result.AddError(ErrorCode.NotFound, "User not found.");
            return result;
        }

      
        var existingCustomer = await _context.Customers
            .FirstOrDefaultAsync(x => x.UserId == request.UserId, cancellationToken);
        if (existingCustomer is not null)
        {
            result.AddError(ErrorCode.RecordFound, "Customer profile already exists for this user.");
            return result;
        }

       
        var customer = MohamedTransit.Domain.Entities.Customer.Create(
            request.BusinessName,
            request.TINNumber,
            request.BusinessLicense,
            request.BusinessAddress,
            request.City,
            request.State,
            request.PostalCode,
            request.ContactPerson,
            request.ContactPhone,
            request.ContactEmail,
            request.BusinessType,
            request.ImportLicense,
            request.ImportLicenseExpiry,
            request.UserId,
            request.CreatedByDataEncoderId
        );

        _context.Customers.Add(customer);
        await _context.SaveChangesAsync(cancellationToken);

        var updatedUser = await _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(x => x.Id == request.UserId, cancellationToken);

        if (updatedUser == null)
        {
            result.AddError(ErrorCode.NotFound, "User not found after customer creation.");
            return result;
        }

        result.Payload = updatedUser;
        result.Message = "Customer profile created successfully.";

        return result;
    }

    
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
