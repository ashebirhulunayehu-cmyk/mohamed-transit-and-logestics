
using MediatR;

using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application.Helper;
using MohamedTransit.Application.Queries.Customer.CaseExecuter;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;

using ShipmentEntity = MohamedTransit.Domain.Entities.Shipment;

namespace MohamedTransit.Application.Handlers;

internal class GetAssignedServicesHandler : IRequestHandler<GetAssignedServicesQuery, OperationResult<List<ShipmentEntity>>>
{
    private readonly ApplicationDbContext _context;

    public GetAssignedServicesHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OperationResult<List<ShipmentEntity>>> Handle(GetAssignedServicesQuery request, CancellationToken cancellationToken)
    {
        var result = new OperationResult<List<ShipmentEntity>>();

        try
        {
            // 1. ለትራንዚት ኃላፊው የተመደቡ ጭነቶችን (Shipments) በ Query ማዘጋጀት
            var servicesQuery = _context.Shipments
                .Where(s => s.AssignedCaseExecutorId == request.AssignedCaseExecutorId)
                .AsQueryable();

            // 2. RecordStatus ካለ ማጣራት (Filter)
            if (request.RecordStatus.HasValue)
            {
                servicesQuery = servicesQuery.Where(u => u.RecordStatus == request.RecordStatus.Value);
            }

            // 3. በፈጠራ ቀን ደርድረው ማምጣት (CreatedAt ወይም Id መጠቀም ይቻላል)
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
