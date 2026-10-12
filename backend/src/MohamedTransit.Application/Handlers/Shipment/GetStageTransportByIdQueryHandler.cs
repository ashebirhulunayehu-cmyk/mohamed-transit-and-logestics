using MediatR;

using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;

using Transit.Application;

namespace MohamedTransit.Application.Handlers.StageTransportHandler;

internal class GetStageTransportByIdQueryHandler
    : IRequestHandler<GetStageTransportByIdQuery, OperationResult<StageTransport>>
{
    private readonly ApplicationDbContext _context;

    public GetStageTransportByIdQueryHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OperationResult<StageTransport>> Handle(
        GetStageTransportByIdQuery request,
        CancellationToken cancellationToken)
    {
        var result = new OperationResult<StageTransport>();

        // 1. StageTransport በ ID ከዳታቤዝ መኖሩን ማረጋገጥ (ለ Read performance AsNoTracking በመጠቀም)
        var stageTransport = await _context.Transports
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == request.Id && t.RecordStatus == RecordStatus.Active, cancellationToken);

        if (stageTransport == null)
        {
            result.AddError(ErrorCode.NotFound, $"StageTransport with ID '{request.Id}' was not found.");
            return result;
        }

        // 2. Result መመለስ
        result.Payload = stageTransport;
        result.Message = "Stage transport record retrieved successfully.";

        return result;
    }
}
