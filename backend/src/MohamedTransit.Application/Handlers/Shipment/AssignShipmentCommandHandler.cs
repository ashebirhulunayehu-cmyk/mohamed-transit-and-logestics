using MediatR;

using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;


// Domain Entity እና Command/Namespace እንዳይጋጩ Alias መጠቀም
using DomainShipment = MohamedTransit.Domain.Entities.Shipment;

namespace MohamedTransit.Application.Handlers.ShipmentHandler;

internal class AssignShipmentCommandHandler : IRequestHandler<AssignShipmentCommand, OperationResult<DomainShipment>>
{
    private readonly ApplicationDbContext _context;

    public AssignShipmentCommandHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OperationResult<DomainShipment>> Handle(AssignShipmentCommand request, CancellationToken cancellationToken)
    {
        var result = new OperationResult<DomainShipment>();

        // 1. Shipment መኖሩን ከነ Sub-entities ማረጋገጥ
        var shipment = await _context.Shipments
            .Include(s => s.Importer)
            .Include(s => s.AssignedCaseExecutor)
            .Include(s => s.AssignedAssessor)
            .Include(s => s.Stages)
            .FirstOrDefaultAsync(s => s.Id == request.ShipmentId, cancellationToken);

        if (shipment == null)
        {
            result.AddError(ErrorCode.NotFound, $"Shipment with ID '{request.ShipmentId}' was not found.");
            return result;
        }

        // 2. Case Executor በስተቀጥታ በዳታቤዝ ውስጥ መኖሩን ማረጋገጥ
        var caseExecutor = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.AssignedCaseExecutorId, cancellationToken);

        if (caseExecutor == null)
        {
            result.AddError(ErrorCode.NotFound, $"Case Executor with ID '{request.AssignedCaseExecutorId}' was not found.");
            return result;
        }

        // 3. Case Executor መመደብ
        shipment.AssignCaseExecutor(request.AssignedCaseExecutorId);

        // 4. Assessor ከተላከ መኖሩን አረጋግጦ መመደብ
        if (request.AssignedAssessorId.HasValue)
        {
            var assessor = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == request.AssignedAssessorId.Value, cancellationToken);

            if (assessor == null)
            {
                result.AddError(ErrorCode.NotFound, $"Assessor with ID '{request.AssignedAssessorId.Value}' was not found.");
                return result;
            }

            shipment.AssignAssessor(request.AssignedAssessorId.Value);
        }

        // 5. Assignment Notes ከተላከ መዝግቦ መያዝ
        if (!string.IsNullOrWhiteSpace(request.AssignmentNotes))
        {
            shipment.AssignmentNotes = request.AssignmentNotes.Trim();
        }

        // 6. የ Shipment Status ወደ InProgress መለወጥ
        shipment.UpdateStatus(ShipmentStatus.InProgress);

        // 7. ለውጦችን Save ማድረግ
        await _context.SaveChangesAsync(cancellationToken);

        result.Payload = shipment;
        result.Message = "Shipment assignment completed successfully.";

        return result;
    }
}
