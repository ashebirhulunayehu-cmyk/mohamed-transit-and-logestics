
using MediatR;

using Microsoft.AspNetCore.Http;

using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Entities;


namespace MohamedTransit.Application.Commands;

public class UploadDocumentCommand : IRequest<OperationResult<StageDocument>>
{
    public long ShipmentId { get; set; }

    public long StageId { get; set; }

    public IFormFile File { get; set; } = null!;

    public DocumentType DocumentType { get; set; }

    public string? Description { get; set; }

    public string? FilePath { get; set; }
}
