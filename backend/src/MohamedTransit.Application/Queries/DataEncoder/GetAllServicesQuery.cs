using MediatR;

using MohamedTransit.Application.DTO;

namespace MohamedTransit.Application.Queries
{
    public record GetAllServicesQuery() : IRequest<IEnumerable<ServiceDto>>;
}
