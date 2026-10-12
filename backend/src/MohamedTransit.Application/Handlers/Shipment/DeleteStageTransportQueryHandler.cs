using MediatR;

using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application;
using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;

namespace MohamedTransit.Application.Handlers.StageTransportHandler;

internal class DeleteStageTransportQueryHandler : IRequestHandler<DeleteStageTransportQuery, OperationResult<bool>>
{
    private readonly ApplicationDbContext _context;

    public DeleteStageTransportQueryHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OperationResult<bool>> Handle(DeleteStageTransportQuery request, CancellationToken cancellationToken)
    {
        var result = new OperationResult<bool>();

        // 1. StageTransport መኖሩን ከዳታቤዝ ማረጋገጥ
        var stageTransport = await _context.Transports
            .FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);

        if (stageTransport == null)
        {
            result.AddError(ErrorCode.NotFound, $"StageTransport with ID '{request.Id}' was not found.");
            result.Payload = false;
            return result;
        }

        // 2. Soft Delete (RecordStatus = Deleted) ወይም Hard Delete ማድረግ
        // Soft Delete የምትጠቀሙ ከሆነ፡
        stageTransport.RecordStatus = RecordStatus.Delete;

        // Hard Delete የምትጠቀሙ ከሆነ ከታች ያለውን መስመር ተቀቀሚ፡
        // _context.Transports.Remove(stageTransport);

        // 3. Save ማድረግ
        await _context.SaveChangesAsync(cancellationToken);

        // 4. Result መመለስ
        result.Payload = true;
        result.Message = "Stage transport deleted successfully.";

        return result;
    }
}
