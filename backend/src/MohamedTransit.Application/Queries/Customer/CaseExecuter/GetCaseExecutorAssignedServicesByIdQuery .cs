using MediatR;

using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Common;

// የ Entity Service እና የ Namespace ግጭትን ለመፍታት alias መጠቀም
using ShipmentEntity = MohamedTransit.Domain.Entities.Shipment;

namespace MohamedTransit.Application.Queries.Customer.CaseExecuter;

public class GetCaseExecutorAssignedServicesByIdQuery : IRequest<OperationResult<ShipmentEntity>>
{
    public long AssignedCaseExecutorId { get; set; }
    public long Id { get; set; }
}
