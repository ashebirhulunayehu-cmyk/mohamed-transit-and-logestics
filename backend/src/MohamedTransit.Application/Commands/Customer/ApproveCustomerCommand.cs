using MediatR;
using MohamedTransit.Domain.Entities;
using MohamedTransit.Application.Helper;
namespace MohamedTransit.Application;

public class ApproveCustomerCommand : IRequest<OperationResult<Customer>>
{
    public long CustomerId { get; set; }
    public bool IsApproved { get; set; }
    public string? Notes { get; set; }
    public long VerifiedByUserId { get; set; }
}




