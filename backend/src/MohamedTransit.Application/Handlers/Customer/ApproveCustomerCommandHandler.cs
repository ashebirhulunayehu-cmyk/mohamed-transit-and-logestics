using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using MohamedTransit.Application.Helper;
using MohamedTransit.Application.Service;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;
namespace MohamedTransit.Application.Handlers.Customer;
internal class ApproveCustomerCommandHandler : IRequestHandler<ApproveCustomerCommand, OperationResult<MohamedTransit.Domain.Entities.Customer>>
{
    private readonly ApplicationDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly TokenHandlerService _tokenHandlerService;

    public ApproveCustomerCommandHandler(
        ApplicationDbContext context,
        IHttpContextAccessor httpContextAccessor,
        TokenHandlerService tokenHandlerService)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
        _tokenHandlerService = tokenHandlerService;
    }

    public async Task<OperationResult<MohamedTransit.Domain.Entities.Customer>> Handle(ApproveCustomerCommand request, CancellationToken cancellationToken)
    {
        var result = new OperationResult<MohamedTransit.Domain.Entities.Customer>();

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

        // 1. Customer መኖሩን ማረጋገጥ
        var customer = await _context.Customers
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.Id == request.CustomerId, cancellationToken);

        if (customer == null)
        {
            result.AddError(ErrorCode.NotFound, "Customer not found.");
            return result;
        }

        // 2. አስቀድሞ የፀደቀ መሆኑን ማረጋገጥ
        if (customer.IsVerified && request.IsApproved)
        {
            result.AddError(ErrorCode.RecordFound, "Customer is already verified.");
            return result;
        }

        // 3. ማፅደቅ ወይም ውድቅ ማድረግ
        if (request.IsApproved)
        {
            customer.Verify(request.VerifiedByUserId, request.Notes);
        }
        else
        {
            customer.SetUpdated();
        }

        await _context.SaveChangesAsync(cancellationToken);

        // 4. የተሻሻለውን Customer መረጃ ከነ-ግንኙነቶቹ መጫን
        var updatedCustomer = await _context.Customers
            .Include(c => c.User)
            .Include(c => c.VerifiedByUser)
            .FirstOrDefaultAsync(c => c.Id == request.CustomerId, cancellationToken);

        if (updatedCustomer == null)
        {
            result.AddError(ErrorCode.NotFound, "Customer not found after approval.");
            return result;
        }

        result.Payload = updatedCustomer;
        result.Message = request.IsApproved ? "Customer approved successfully." : "Customer rejection recorded.";

        return result;
    }

    private string? GetCurrentUserName()
    {
        var authorizationHeader = _httpContextAccessor.HttpContext?.Request.Headers["Authorization"].ToString();
        if (string.IsNullOrEmpty(authorizationHeader) || !authorizationHeader.StartsWith("Bearer "))
            return null;

        var token = authorizationHeader.Substring("Bearer ".Length).Trim();
        var claims = _tokenHandlerService.GetClaims(token);
        var userNameClaim = claims?.FirstOrDefault(c => c.Type == "userName");
        return userNameClaim?.Value;
    }
}
