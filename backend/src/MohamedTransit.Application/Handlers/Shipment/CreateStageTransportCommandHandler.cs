using MediatR;

using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application.Commands;
using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.Application.Handlers.StageTransportHandler;

internal class CreateStageTransportCommandHandler : IRequestHandler<CreateStageTransportCommand, OperationResult<StageTransport>>
{
    private readonly ApplicationDbContext _context;

    public CreateStageTransportCommandHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OperationResult<StageTransport>> Handle(CreateStageTransportCommand request, CancellationToken cancellationToken)
    {
        var result = new OperationResult<StageTransport>();

        // 1. ProductAmount null አለመሆኑን ማረጋገጥ
        if (request.ProductAmount == null)
        {
            result.AddError(ErrorCode.ValidationError, "ProductAmount is required.");
            return result;
        }

        // 2. ShipmentStageId ተልኮ ከሆነ በዳታቤዝ ውስጥ መኖሩን ማረጋገጥ (_context.Stages በመጠቀም)
        if (request.ShipmentStageId.HasValue)
        {
            var stageExists = await _context.Stages
                .AnyAsync(s => s.Id == request.ShipmentStageId.Value, cancellationToken);

            if (!stageExists)
            {
                result.AddError(ErrorCode.NotFound, $"Shipment Stage with ID '{request.ShipmentStageId.Value}' was not found.");
                return result;
            }
        }

        // 3. static Factory Method በመጠቀም Entityውን መፍጠር (request.ProductAmount.Value ተጠቅመናል)
        var stageTransport = StageTransport.Create(
            fullName: request.FullName.Trim(),
            licenceDocument: request.LicenceDocument.Trim(),
            plateNumber: request.PlateNumber.Trim(),
            phoneNumber: request.PhoneNumber.Trim(),
            productAmount: request.ProductAmount.Value,
            serviceStageId: request.ShipmentStageId
        );

        // 4. ዳታቤዝ ውስጥ መጨመር እና Save ማድረግ (_context.Transports በመጠቀም)
        await _context.Transports.AddAsync(stageTransport, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        // 5. Result መመለስ
        result.Payload = stageTransport;
        result.Message = "Stage transport created successfully.";

        return result;
    }
}
