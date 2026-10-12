using System.Security.Claims;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Entities;
using MohamedTransit.Domain.Data;
using Microsoft.AspNetCore.Http;
using MohamedTransit.Application.Helper;

public class GetAllCustomersQueryHandler : IRequestHandler<GetAllCustomersQuery, OperationResult<List<Customer>>>
{
    private readonly ApplicationDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public GetAllCustomersQueryHandler(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<OperationResult<List<Customer>>> Handle(GetAllCustomersQuery request, CancellationToken cancellationToken)
    {
        var currentUserIdClaim = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? _httpContextAccessor.HttpContext?.User.FindFirstValue("id")
            ?? _httpContextAccessor.HttpContext?.User.FindFirstValue("sub");

        if (!long.TryParse(currentUserIdClaim, out var currentUserId))
        {
            return OperationResult<List<Customer>>.Failure(new List<Error>
            {
                new Error(ErrorCode.UnAuthorized, "User not authenticated or invalid token.")
            });
        }

        var query = _context.Customers
            .Include(c => c.User)
            .Where(c => c.CreatedByDataEncoderId == currentUserId);

        var customers = await query.OrderByDescending(c => c.CreateAt).ToListAsync(cancellationToken);

        return OperationResult<List<Customer>>.Success(customers);
    }
}