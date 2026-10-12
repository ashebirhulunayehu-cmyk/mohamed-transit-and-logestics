using System.Collections.Generic;

using MediatR;

using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Common;

using ShipmentEntity = MohamedTransit.Domain.Entities.Shipment;
namespace MohamedTransit.Application.Queries.Customer.CaseExecuter;
public class GetAssignedServicesQuery : IRequest<OperationResult<List<ShipmentEntity>>>
{
    public long AssignedCaseExecutorId { get; set; }
    public RecordStatus? RecordStatus { get; set; }
}
