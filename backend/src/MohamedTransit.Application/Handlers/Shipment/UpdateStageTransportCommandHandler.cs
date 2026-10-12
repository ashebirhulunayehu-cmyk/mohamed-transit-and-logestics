using MediatR;

using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application;
using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.Application.Handlers.StageTransportHandler;

internal class UpdateStageTransportCommandHandler : IRequestHandler<UpdateStageTransportCommand, OperationResult<StageTransport>>
{
    private readonly ApplicationDbContext _context;

    public UpdateStageTransportCommandHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OperationResult<StageTransport>> Handle(UpdateStageTransportCommand request, CancellationToken cancellationToken)
    {
        var result = new OperationResult<StageTransport>();

        // 1. StageTransport በ ID ከዳታቤዝ መኖሩን ማረጋገጥ
        var stageTransport = await _context.Transports
            .FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);

        if (stageTransport == null)
        {
            result.AddError(ErrorCode.NotFound, $"StageTransport with ID '{request.Id}' was not found.");
            return result;
        }

        // 2. ServiceStageId ተልኮ ከሆነ በዳታቤዝ ውስጥ መኖሩን ማረጋገጥ
        if (request.ServiceStageId.HasValue)
        {
            var stageExists = await _context.ServiceStageExecutions
                .AnyAsync(s => s.Id == request.ServiceStageId.Value, cancellationToken);

            if (!stageExists)
            {
                result.AddError(ErrorCode.NotFound, $"ServiceStageExecution with ID '{request.ServiceStageId.Value}' was not found.");
                return result;
            }
        }

        // 3. በ Entityው ላይ በሚገኘው Update method (ወይም setters) መረጃዎችን ማደስ
        stageTransport.UpdateTransport(
            fullName: request.FullName.Trim(),
            licenceDocument: request.LicenceDocument.Trim(),
            plateNumber: request.PlateNumber.Trim(),
            phoneNumber: request.PhoneNumber.Trim(),
            productAmount: request.ProductAmount,
            serviceStageId: request.ServiceStageId,
            recordStatus: request.RecordStatus
        );

        // 4. Save ማድረግ
        await _context.SaveChangesAsync(cancellationToken);

        // 5. Result መመለስ
        result.Payload = stageTransport;
        result.Message = "Stage transport updated successfully.";

        return result;
    }
}
