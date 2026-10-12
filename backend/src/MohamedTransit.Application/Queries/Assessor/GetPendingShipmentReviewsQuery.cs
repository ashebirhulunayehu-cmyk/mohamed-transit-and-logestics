using MediatR;

using MohamedTransit.Application.Helper;

using System.Collections.Generic;

using ShipmentEntity = MohamedTransit.Domain.Entities.Shipment; // Alias በመጠቀም ግጭቱን መፍታት

namespace MohamedTransit.Application.Queries.Assessor;

public class GetPendingShipmentReviewsQuery : IRequest<OperationResult<List<ShipmentEntity>>>
{
    public string UserId { get; set; }

    public GetPendingShipmentReviewsQuery(string userId)
    {
        UserId = userId;
    }
}
