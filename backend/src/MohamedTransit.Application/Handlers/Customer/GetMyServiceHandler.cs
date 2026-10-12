

using MediatR;

using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application.Helper;
using MohamedTransit.Application.Queries.Customer;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;

using ShipmentEntity = MohamedTransit.Domain.Entities.Shipment;

namespace MohamedTransit.Application.Handlers.Customer;

internal class GetMyServiceHandler : IRequestHandler<GetMyServicesQuery, OperationResult<List<ShipmentEntity>>>
{
    private readonly ApplicationDbContext _context;

    public GetMyServiceHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OperationResult<List<ShipmentEntity>>> Handle(GetMyServicesQuery request, CancellationToken cancellationToken)
    {
        var result = new OperationResult<List<ShipmentEntity>>();

        try
        {
            // 1. የደንበኛውን Shipment/Service መረጃ በ Query ደረጃ ማዘጋጀት
            // 1. የደንበኛውን Shipment/Service መረጃ በ Query ደረጃ ማዘጋጀት
            var servicesQuery = _context.Shipments
                .Where(s => s.ImporterId == request.CustomerId)
                .AsQueryable();

            // 2. RecordStatus ካለ ማጣራት (Filter)
            if (request.RecordStatus.HasValue)
            {
                servicesQuery = servicesQuery.Where(u => u.RecordStatus == request.RecordStatus.Value);
            }

          
            var services = await servicesQuery
                .OrderByDescending(s => s.CreateAt) 
                .ToListAsync(cancellationToken);

            if (services == null || !services.Any())
            {
                result.AddError(ErrorCode.Ok, "No Service Data for this user!");
                return result;
            }

            result.Payload = services;
            return result;
        }
        catch (Exception ex)
        {
            result.AddError(ErrorCode.ServerError, ex.Message);
            return result;
        }
    }
}
