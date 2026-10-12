using MediatR;

using MohamedTransit.Application.Helper;

namespace MohamedTransit.Application;

public class DeleteStageTransportQuery : IRequest<OperationResult<bool>>
{
    public long Id { get; set; }
}
