using MediatR;

using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Entities;
namespace MohamedTransit.Application.Queries.Customer.CaseExecuter;

public class DownloadStageDocumentQuery : IRequest<OperationResult<StageDocument>>
{
    public long DocumentId { get; set; }
}
