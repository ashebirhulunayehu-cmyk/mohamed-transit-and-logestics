using MediatR;
using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Entities;
public class GetAllCustomersQuery : IRequest<OperationResult<List<Customer>>>
{

    public RecordStatus? RecordStatus { get; set; }
}
