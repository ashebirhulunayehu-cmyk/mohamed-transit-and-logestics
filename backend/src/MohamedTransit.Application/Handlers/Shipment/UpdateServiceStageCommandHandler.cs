using MediatR;

using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application;
using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.Application.Handlers.ShipmentStageHandler;

internal class UpdateServiceStageCommandHandler : IRequestHandler<UpdateServiceStageCommand, OperationResult<ServiceStageExecution>>
{
    private readonly ApplicationDbContext _context;

    public UpdateServiceStageCommandHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OperationResult<ServiceStageExecution>> Handle(UpdateServiceStageCommand request, CancellationToken cancellationToken)
    {
        var result = new OperationResult<ServiceStageExecution>();

        // 1. ServiceStageExecution መኖሩን ከነ ShipmentId ማረጋገጥ
        // (ማስታወሻ፡ በ ApplicationDbContext ላይ ያለው DbSet 'ServiceStageExecutions' ከሆነ እሱን ተቀቀሚ)
        var stageExecution = await _context.ServiceStageExecutions
            .FirstOrDefaultAsync(s => s.Id == request.ShipmentStageId && s.ShipmentId == request.ShipmentId, cancellationToken);

        if (stageExecution == null)
        {
            result.AddError(ErrorCode.NotFound, $"Stage execution with ID '{request.ShipmentStageId}' for Shipment '{request.ShipmentId}' was not found.");
            return result;
        }

        // 2. የሚያሻሽለው ተጠቃሚ (UpdatedByUserId) በዳታቤዝ ውስጥ መኖሩን ማረጋገጥ
        var userExists = await _context.Users
            .AnyAsync(u => u.Id == request.UpdatedByUserId, cancellationToken);

        if (!userExists)
        {
            result.AddError(ErrorCode.NotFound, $"User with ID '{request.UpdatedByUserId}' was not found.");
            return result;
        }

        // 3. Status እና Comments/Notes ማሻሻል (የ Entityው UpdateStatus method በመጠቀም)
        stageExecution.UpdateStatus(request.Status, request.Notes);

        // 4. ለውጦችን Save ማድረግ
        await _context.SaveChangesAsync(cancellationToken);

        // 5. Result መመለስ
        result.Payload = stageExecution;
        result.Message = "Stage execution status updated successfully.";

        return result;
    }
}
