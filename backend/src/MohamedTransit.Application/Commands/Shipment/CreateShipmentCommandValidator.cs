using FluentValidation;

namespace MohamedTransit.Application.Commands.Shipment;

public class CreateShipmentCommandValidator : AbstractValidator<CreateServiceCommand>
{
    public CreateShipmentCommandValidator()
    {
        RuleFor(x => x.ImporterId)
            .NotEmpty().WithMessage("Importer ID is required.");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Shipment description is required.")
            .MaximumLength(500).WithMessage("Description cannot exceed 500 characters.");

        RuleFor(x => x.Mode)
            .IsInEnum().WithMessage("A valid transport mode must be selected.");

        RuleFor(x => x.Origin)
            .NotEmpty().WithMessage("Origin city/port is required.");

        RuleFor(x => x.Destination)
            .NotEmpty().WithMessage("Destination city/port is required.");
    }
}
