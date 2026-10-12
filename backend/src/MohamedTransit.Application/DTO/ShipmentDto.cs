namespace MohamedTransit.Application.DTO;

public sealed record ShipmentDto(
    long Id,
    string TrackingNumber,
    long ImporterId,
    string Description,
    string Mode,
    string AssignedHub,
    string Status,
    string Origin,
    string Destination,
    DateTime CreateAt,
    DateTime? UpdatedAt
);
