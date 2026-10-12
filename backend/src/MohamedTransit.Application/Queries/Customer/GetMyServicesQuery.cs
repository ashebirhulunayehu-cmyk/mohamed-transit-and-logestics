using MediatR;

using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Common;

using System.Collections.Generic;
// የ Entityው Service እና የ Namespace ግጭትን ለመፍታት Alias መጠቀም
using ShipmentEntity = MohamedTransit.Domain.Entities.Shipment;

namespace MohamedTransit.Application.Queries.Customer;

public class GetMyServicesQuery : IRequest<OperationResult<List<ShipmentEntity>>>
{
    public RecordStatus? RecordStatus { get; set; }
    public long CustomerId { get; set; }
}
