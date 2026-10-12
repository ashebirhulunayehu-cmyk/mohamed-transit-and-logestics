using MediatR;
using Microsoft.EntityFrameworkCore;
using MohamedTransit.Application.Helper;
using MohamedTransit.Application.Queries.Customer;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.Application.Handlers.Customer;

internal class GetAllCustomerHandler : IRequestHandler<GetAllCustomersQuery, OperationResult<List<MohamedTransit.Domain.Entities.Customer>>>
{
    private readonly ApplicationDbContext _context;

    public GetAllCustomerHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OperationResult<List<MohamedTransit.Domain.Entities.Customer>>> Handle(GetAllCustomersQuery request, CancellationToken cancellationToken)
    {
        var result = new OperationResult<List<MohamedTransit.Domain.Entities.Customer>>();

        try
        {
            // 1. IQueryable በመጠቀም ዳታቤዝ ደረጃ ማጣራት (Database-level filtering)
            var query = _context.Customers.AsQueryable();

            if (request.RecordStatus.HasValue)
            {
                query = query.Where(c => c.RecordStatus == request.RecordStatus.Value);
            }

            // 2. በ StartDate ቅደም ተከተል ማደራጀት እና ዳታውን ማምጣት
            var customers = await query
                .OrderByDescending(o => o.StartDate)
                .ToListAsync(cancellationToken);

            if (customers == null || customers.Count == 0)
            {
                result.AddError(ErrorCode.Ok, "No Privilege Data!");
                return result;
            }

            result.Payload = customers;
            return result;
        }
        catch (Exception ex)
        {
            result.AddError(ErrorCode.ServerError, ex.Message);
            return result;
        }
    }
}
