

using MohamedTransit.Domain.Common;

namespace MohamedTransit.Application.DTO;

public class DocumentDetail
{
    public long Id { get; set; }
    public long ServiceStageId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string FileExtension { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string MimeType { get; set; } = string.Empty;
    public DocumentType DocumentType { get; set; }
    public string? Description { get; set; }
    public bool IsRequired { get; set; }
    public bool IsVerified { get; set; }
    public string? VerificationNotes { get; set; }
    public long UploadedByUserId { get; set; }
    public long? VerifiedByUserId { get; set; }
    public DateTime CreatedDate { get; set; }
}
