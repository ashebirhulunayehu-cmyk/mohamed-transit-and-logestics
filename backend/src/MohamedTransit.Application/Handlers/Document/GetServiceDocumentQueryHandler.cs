using MediatR;

using Microsoft.EntityFrameworkCore; // ToListAsync እና OrderByDescending እንዲሰሩ ተጨምሯል

using MohamedTransit.Application.Helper;
using MohamedTransit.Application.Queries.Document;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.Application.Handlers.Document;

internal class GetServiceDocumentsQueryHandler : IRequestHandler<GetServiceDocumentsQuery, OperationResult<List<ServiceDocument>>>
{
    private readonly ApplicationDbContext _context;

    public GetServiceDocumentsQueryHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OperationResult<List<ServiceDocument>>> Handle(GetServiceDocumentsQuery request, CancellationToken cancellationToken)
    {
        var result = new OperationResult<List<ServiceDocument>>();
        try
        {
            var servicesQuery = _context.ServiceDocuments
                                      .Where(s => s.ShipmentId == request.ServiceId)
                                      .OrderByDescending(s => s.CreateAt) // StartDate በ CreatedDate ተተክቷል
                                      .AsQueryable();

            if (request.RecordStatus == RecordStatus.Active)
                servicesQuery = servicesQuery.Where(u => u.RecordStatus == Domain.Common.RecordStatus.Active);
            else if (request.RecordStatus == RecordStatus.InActive)
                servicesQuery = servicesQuery.Where(u => u.RecordStatus == Domain.Common.RecordStatus.InActive);
            else if (request.RecordStatus == RecordStatus.Delete)
                servicesQuery = servicesQuery.Where(u => u.RecordStatus == Domain.Common.RecordStatus.Delete);

            var services = await servicesQuery.ToListAsync(cancellationToken);

            if (!services.Any())
            {
                result.AddError(ErrorCode.Ok, "No Document Data for this service!");
                return result;
            }

            result.Payload = services;
            return result;
        }
        catch (Exception ex)
        {
            result.AddError(ErrorCode.ServerError, ex.Message);
        }
        return result;
    }
}
