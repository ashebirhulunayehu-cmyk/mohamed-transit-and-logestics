using FluentValidation;

namespace MohamedTransit.Application.Commands.Shipment;

public sealed class UpdateShipmentStatusCommandValidator
    : AbstractValidator<UpdateShipmentStatusCommand>
{
    public UpdateShipmentStatusCommandValidator()
    {
        RuleFor(x => x.ShipmentId)
            .NotEmpty()
            .WithMessage("Shipment ID is required.");

        RuleFor(x => x.NewStatus)
            .IsInEnum()
            .WithMessage("A valid shipment status must be specified.");

        RuleFor(x => x.UpdatedByHub)
            .IsInEnum()
            .WithMessage("A valid operational hub must be specified.");

        RuleFor(x => x.Remarks)
            .Must(x => string.IsNullOrWhiteSpace(x) || x.Trim().Length <= 1000)
            .WithMessage("Remarks cannot exceed 1000 characters.");
    }
}
