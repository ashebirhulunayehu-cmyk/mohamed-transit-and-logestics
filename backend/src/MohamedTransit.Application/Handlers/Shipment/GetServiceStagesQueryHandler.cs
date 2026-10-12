using MediatR;

using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;

using MohamedTransit.Application;

namespace MohamedTransit.Application.Handlers.ServiceStageHandler;

internal class GetServiceStagesQueryHandler
    : IRequestHandler<GetServiceStagesQuery, OperationResult<List<ServiceStageExecution>>>
{
    private readonly ApplicationDbContext _context;

    public GetServiceStagesQueryHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OperationResult<List<ServiceStageExecution>>> Handle(
        GetServiceStagesQuery request,
        CancellationToken cancellationToken)
    {
        var result = new OperationResult<List<ServiceStageExecution>>();

        // 1. Shipment በ ShipmentId (request.ShipmentId) መኖሩን ማረጋገጥ
        var shipmentExists = await _context.Shipments
            .AnyAsync(s => s.Id == request.ShipmentId, cancellationToken);

        if (!shipmentExists)
        {
            result.AddError(ErrorCode.NotFound, $"Shipment with ID '{request.ShipmentId}' was not found.");
            result.Payload = new List<ServiceStageExecution>();
            return result;
        }

        // 2. የተጠየቀውን ShipmentId የሚጋሩ Active ServiceStageExecutions ማምጣት
        var serviceStages = await _context.ServiceStageExecutions
            .AsNoTracking()
            .Where(s => s.ShipmentId == request.ShipmentId && s.RecordStatus == RecordStatus.Active)
            .Include(s => s.Documents)
            .ToListAsync(cancellationToken);

        // 3. Result መመለስ
        result.Payload = serviceStages;
        result.Message = $"Retrieved {serviceStages.Count} service stage execution(s) successfully.";

        return result;
    }
}
