using MediatR;

using MohamedTransit.Application.Helper;

using MohamedTransit.Domain.Entities;

namespace MohamedTransit.Application;

public class AssignShipmentCommand : IRequest<OperationResult<Shipment>>
{
    public long ShipmentId { get; set; }
    public long AssignedCaseExecutorId { get; set; }
    public long? AssignedAssessorId { get; set; }
    public string? AssignmentNotes { get; set; }
    public long? AssignedByUserId { get; set; }
}




