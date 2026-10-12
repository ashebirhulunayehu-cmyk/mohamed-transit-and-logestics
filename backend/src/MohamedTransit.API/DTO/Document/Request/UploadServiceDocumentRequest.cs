using System.ComponentModel.DataAnnotations;

using MohamedTransit.Domain.Common;

namespace MohamedTransit.API.DTO.Document.Request;

public class UploadServiceDocumentRequest
{
    [Required]
    public long ShipmentId { get; set; }

    public long? ShipmentStageId { get; set; }

    [Required]
    public IFormFile File { get; set; } = null!; // null-forgiving because it's required
    public string? FilePath { get; set; }

    [Required]
    public DocumentType DocumentType { get; set; }

    public string? Description { get; set; }

}
