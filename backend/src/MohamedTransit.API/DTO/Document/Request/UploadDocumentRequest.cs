using System.ComponentModel.DataAnnotations;

using MohamedTransit.Domain.Common;

namespace MohamedTransit.API.DTO.Document.Request;

public class UploadDocumentRequest
{
    [Required]
    public long ShipmentId { get; set; }

    [Required]
    public long StageId { get; set; }

    [Required]
    public IFormFile File { get; set; } = null!; // null-forgiving because it's required
    public string? FilePath { get; set; }

    [Required]
    public DocumentType DocumentType { get; set; }

    public string? Description { get; set; }
}
