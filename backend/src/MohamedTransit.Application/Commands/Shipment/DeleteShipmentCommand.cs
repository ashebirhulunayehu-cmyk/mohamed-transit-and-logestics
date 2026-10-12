using MediatR;

namespace MohamedTransit.Application.Commands.Shipment;

public record DeleteShipmentCommand(long Id) : IRequest<bool>;
