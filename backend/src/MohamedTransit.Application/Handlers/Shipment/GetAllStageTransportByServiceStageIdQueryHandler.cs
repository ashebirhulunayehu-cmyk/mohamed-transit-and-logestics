using MediatR;

using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;

using Transit.Application;

namespace MohamedTransit.Application.Handlers.StageTransportHandler;

internal class GetAllStageTransportByServiceStageIdQueryHandler
    : IRequestHandler<GetAllStageTransportByServiceStageIdQuery, OperationResult<List<StageTransport>>>
{
    private readonly ApplicationDbContext _context;

    public GetAllStageTransportByServiceStageIdQueryHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OperationResult<List<StageTransport>>> Handle(
        GetAllStageTransportByServiceStageIdQuery request,
        CancellationToken cancellationToken)
    {
        var result = new OperationResult<List<StageTransport>>();

        // 1. ServiceStageExecution/Stage በ ID መኖሩን ማረጋገጥ
        var stageExists = await _context.ServiceStageExecutions
            .AnyAsync(s => s.Id == request.ServiceStageId, cancellationToken);

        if (!stageExists)
        {
            result.AddError(ErrorCode.NotFound, $"Service stage with ID '{request.ServiceStageId}' was not found.");
            result.Payload = new List<StageTransport>();
            return result;
        }

        // 2. የተጠየቀውን ServiceStageId የሚጋሩ Active Transports በሙሉ መፈለግ
        var transports = await _context.Transports
            .AsNoTracking()
            .Where(t => t.ServiceStageId == request.ServiceStageId && t.RecordStatus == RecordStatus.Active)
            .ToListAsync(cancellationToken);

        // 3. Result መመለስ
        result.Payload = transports;
        result.Message = $"Retrieved {transports.Count} stage transport record(s) successfully.";

        return result;
    }
}
