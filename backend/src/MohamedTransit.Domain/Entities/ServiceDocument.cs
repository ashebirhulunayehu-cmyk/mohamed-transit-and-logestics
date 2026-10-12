using MohamedTransit.Domain.Common;

namespace MohamedTransit.Domain.Entities;

public class ServiceDocument : BaseEntity
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
    public long? ShipmentId { get; private set; }
    public long? ShipmentStageId { get; private set; }
    public long? UploadedByUserId { get; private set; }
    public long? VerifiedByUserId { get; private set; }

    // Navigation Properties
    public Shipment? Shipment { get; set; }
   // public ServiceStageExecution? ServiceStage { get; set; } // ስህተቱ እዚህ ጋር ተስተካክሏል
    public User? UploadedByUser { get; set; }
    public User? VerifiedByUser { get; set; }

    private ServiceDocument() { }

    public static ServiceDocument Create(
        string fileName,
        string filePath,
        string originalFileName,
        string fileExtension,
        long fileSizeBytes,
        string mimeType,
        DocumentType documentType,
        long serviceId,
        long uploadedByUserId,
        long? serviceStageId = null,
        string? description = null,
        bool isRequired = false)
    {
        return new ServiceDocument
        {
            FileName = fileName,
            FilePath = filePath,
            OriginalFileName = originalFileName,
            FileExtension = fileExtension,
            FileSizeBytes = fileSizeBytes,
            MimeType = mimeType,
            DocumentType = documentType,
            ShipmentId = serviceId,
            ShipmentStageId = serviceStageId,
            UploadedByUserId = uploadedByUserId,
            Description = description,
            IsRequired = isRequired,
            IsVerified = false,
            RecordStatus = RecordStatus.Active
        };
    }

    public void Verify(long verifiedByUserId, string? notes = null)
    {
        IsVerified = true;
        VerifiedByUserId = verifiedByUserId;
        VerificationNotes = notes;
        SetUpdated();
    }

    public void UpdateDescription(string description)
    {
        Description = description;
        SetUpdated();
    }

    public void VerifyDocument(bool isVerified, string? verificationNotes = null)
    {
        IsVerified = isVerified;
        VerificationNotes = verificationNotes;
        SetUpdated();
    }
}
