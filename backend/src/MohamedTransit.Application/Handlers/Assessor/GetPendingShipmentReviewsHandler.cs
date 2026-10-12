using MediatR;
using Microsoft.EntityFrameworkCore;
using MohamedTransit.Domain.Common;
using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Entities;
using ShipmentEntity = MohamedTransit.Domain.Entities.Shipment;
using MohamedTransit.Domain.Data;
using MohamedTransit.Application.Queries.Assessor;

namespace MohamedTransit.Application.Handlers.Assessor;

internal class GetPendingShipmentReviewsHandler : IRequestHandler<GetPendingShipmentReviewsQuery, OperationResult<List<ShipmentEntity>>>
{
    private readonly ApplicationDbContext _context;

    public GetPendingShipmentReviewsHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OperationResult<List<ShipmentEntity>>> Handle(GetPendingShipmentReviewsQuery request, CancellationToken cancellationToken)
    {
        var result = new OperationResult<List<ShipmentEntity>>();

        if (!long.TryParse(request.UserId, out long parsedAssessorId))
        {
            result.Message = "Assessor Id is wrong";
            result.Payload = new List<ShipmentEntity>();
            return result;
        }

        var pendingShipments = await _context.Shipments
            .Include(s => s.Importer)
            .Include(s => s.AssignedCaseExecutor)
            .Include(s => s.AssignedAssessor)
            .Include(s => s.Stages)
                .ThenInclude(stage => stage.StageComments)
            .Include(s => s.Stages)
                .ThenInclude(stage => stage.Documents)
            .Include(s => s.Documents)
            .Include(s => s.Messages)
            .Where(s => s.AssignedAssessorId == parsedAssessorId &&
                       (s.Status == ShipmentStatus.Draft || s.Status == ShipmentStatus.UnderReview))
            .ToListAsync(cancellationToken);

        if (pendingShipments == null || !pendingShipments.Any())
        {
            result.Message = "No unreviewed shipment assigned to the assessor was found.";
            result.Payload = new List<ShipmentEntity>();
            return result;
        }

        result.Payload = pendingShipments;
        result.Message = "Unreviewed shipments were successfully retrieved";
        return result;
    }
}
