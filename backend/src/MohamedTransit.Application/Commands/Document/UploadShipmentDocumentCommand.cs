using MediatR;
using Microsoft.AspNetCore.Http;
using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Entities;
namespace MohamedTransit.Application.Documents.Commands;
public class UploadShipmentDocumentCommand : IRequest<OperationResult<ServiceDocument>>
{
    public long ShipmentId { get; set; } // ServiceId ወደ ShipmentId ተቀይሯል
    public long UploadedByUserId { get; set; }
    public IFormFile File { get; set; } = null!;
    public DocumentType DocumentType { get; set; }
    public long? ServiceStageId { get; set; }
    public string? Description { get; set; }
    public string? FilePath { get; set; }
}
