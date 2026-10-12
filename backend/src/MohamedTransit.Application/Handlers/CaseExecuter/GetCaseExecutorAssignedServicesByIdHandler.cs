using MediatR;

using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application.Helper;
using MohamedTransit.Application.Queries.Customer.CaseExecuter;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;

using ShipmentEntity = MohamedTransit.Domain.Entities.Shipment;
namespace MohamedTransit.Application.Handlers;
internal class GetCaseExecutorAssignedServicesByIdHandler
    : IRequestHandler<GetCaseExecutorAssignedServicesByIdQuery, OperationResult<ShipmentEntity>>
{
    private readonly ApplicationDbContext _context;

    public GetCaseExecutorAssignedServicesByIdHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OperationResult<ShipmentEntity>> Handle(
        GetCaseExecutorAssignedServicesByIdQuery request,
        CancellationToken cancellationToken)
    {
        var result = new OperationResult<ShipmentEntity>();

        try
        {
            var service = await _context.Shipments
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.AssignedCaseExecutorId == request.AssignedCaseExecutorId
                                       && s.Id == request.Id, cancellationToken);

            if (service == null)
            {
                result.AddError(ErrorCode.Ok, "No Service found for this executor!");
                return result;
            }

            result.Payload = service;
            return result;
        }
        catch (Exception ex)
        {
            result.AddError(ErrorCode.ServerError, ex.Message);
            return result;
        }
    }
}
