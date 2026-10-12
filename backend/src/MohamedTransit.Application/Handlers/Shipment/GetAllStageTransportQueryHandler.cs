using MediatR;

using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application;
using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.Application.Handlers.StageTransportHandler;

internal class GetAllStageTransportQueryHandler
    : IRequestHandler<GetAllStageTransportQuery, OperationResult<List<StageTransport>>>
{
    private readonly ApplicationDbContext _context;

    public GetAllStageTransportQueryHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OperationResult<List<StageTransport>>> Handle(
        GetAllStageTransportQuery request,
        CancellationToken cancellationToken)
    {
        var result = new OperationResult<List<StageTransport>>();

        // 1. Queryable ማዘጋጀት (ለ Read performance AsNoTracking በመጠቀም)
        var query = _context.Transports.AsNoTracking();

        // 2. RecordStatus ተልኮ ከሆነ በሱ filter ማድረግ፤ ካልተላከ በ default Active የሆኑትን ብቻ ማምጣት
        if (request.RecordStatus.HasValue)
        {
            query = query.Where(t => t.RecordStatus == request.RecordStatus.Value);
        }
        else
        {
            query = query.Where(t => t.RecordStatus == RecordStatus.Active);
        }

        // 3. ዳታውን ከዳታቤዝ መቀበል
        var transports = await query.ToListAsync(cancellationToken);

        // 4. Result መመለስ
        result.Payload = transports;
        result.Message = $"Retrieved {transports.Count} stage transport record(s) successfully.";

        return result;
    }
}
