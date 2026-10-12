using MediatR;

using MohamedTransit.Application.Helper;
namespace MohamedTransit.Application.Queries.Customer.CaseExecuter;
public class DownloadMultipleStageDocumentsQuery : IRequest<OperationResult<byte[]>>
{
    public List<long> DocumentIds { get; set; } = new();
}
