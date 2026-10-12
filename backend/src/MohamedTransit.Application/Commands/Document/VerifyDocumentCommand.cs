using MediatR;

using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.Application.Commands;
public class VerifyDocumentCommand : IRequest<OperationResult<ServiceDocument>>
{
    public long DocumentId { get; set; }
    public bool IsVerified { get; set; }
    public string? VerificationNotes { get; set; }
    public long VerifiedByUserId { get; set; }
}
