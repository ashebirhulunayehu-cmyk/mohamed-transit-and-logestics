using MediatR;

using MohamedTransit.Application.DTO;
using MohamedTransit.Domain.Common;

namespace MohamedTransit.Application.Queries.Shipment;

public record GetAllShipmentsQuery(RecordStatus RecordStatus) : IRequest<IEnumerable<ShipmentDto>>;
