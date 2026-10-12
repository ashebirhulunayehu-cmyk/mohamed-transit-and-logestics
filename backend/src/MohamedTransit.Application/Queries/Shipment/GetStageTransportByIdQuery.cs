using MediatR;
using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Entities;
namespace Transit.Application;

public class GetStageTransportByIdQuery : IRequest<OperationResult<StageTransport>>
{
    public long Id { get; set; }
}
