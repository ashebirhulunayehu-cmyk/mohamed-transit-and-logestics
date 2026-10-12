using MohamedTransit.Domain;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Entities;



namespace MohamedTransit.Domain.Entities;

public class StageDocument : BaseEntity
{
    public string FileName { get; private set; } = string.Empty;
    public string FilePath { get; private set; } = string.Empty;
    public string OriginalFileName { get; private set; } = string.Empty;
    public string FileExtension { get; private set; } = string.Empty;
    public long FileSizeBytes { get; private set; }
    public string MimeType { get; private set; } = string.Empty;
    public DocumentType DocumentType { get; private set; }
    public string? Description { get; private set; }
    public bool IsRequired { get; private set; }
    public bool IsVerified { get; private set; }
    public string? VerificationNotes { get; private set; }

    // Foreign Keys
    public long? ServiceStageId { get; private set; }
    public long? UploadedByUserId { get; private set; }
    public long? VerifiedByUserId { get; private set; }

    // Navigation Properties
    //  public ServiceStageExecution? ServiceStage { get; set; }
    public User? UploadedByUser { get; set; }
    public User? VerifiedByUser { get; set; }

    public static StageDocument Create(
        string fileName,
        string filePath,
        string originalFileName,
        string fileExtension,
        long fileSizeBytes,
        string mimeType,
        DocumentType documentType,
        long serviceStageId,
        long uploadedByUserId,
        string? description = null,
        bool isRequired = false)
    {
        return new StageDocument
        {
            FileName = fileName,
            FilePath = filePath,
            OriginalFileName = originalFileName,
            FileExtension = fileExtension,
            FileSizeBytes = fileSizeBytes,
            MimeType = mimeType,
            DocumentType = documentType,
            ServiceStageId = serviceStageId,
            UploadedByUserId = uploadedByUserId,
            Description = description,
            IsRequired = isRequired,
            IsVerified = false,
            RecordStatus = RecordStatus.Active
        };
    }

    public void Verify(long verifiedByUserId, string? verificationNotes = null)
    {
        IsVerified = true;
        VerifiedByUserId = verifiedByUserId;
        VerificationNotes = verificationNotes;
        SetUpdated();
    }

    public void UpdateDescription(string description)
    {
        Description = description;
        SetUpdated();
    }
}
