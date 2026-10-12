using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using MohamedTransit.Domain;
using MohamedTransit.Domain.Common;

namespace MohamedTransit.Domain.Entities;

public class CustomerDocument : BaseEntity
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
    public DateTime? ExpiryDate { get; private set; }

    // Foreign Keys
    public long? CustomerId { get; private set; }
    public long? UploadedByUserId { get; private set; }
    public long? VerifiedByUserId { get; private set; }

    // Navigation Properties
    public Customer? Customer { get; set; }
    public User? UploadedByUser { get; set; }
    public User? VerifiedByUser { get; set; }

    public static CustomerDocument Create(
        string fileName,
        string filePath,
        string originalFileName,
        string fileExtension,
        long fileSizeBytes,
        string mimeType,
        DocumentType documentType,
        long customerId,
        long uploadedByUserId,
        string? description = null,
        bool isRequired = false,
        DateTime? expiryDate = null)
    {
        return new CustomerDocument
        {
            FileName = fileName,
            FilePath = filePath,
            OriginalFileName = originalFileName,
            FileExtension = fileExtension,
            FileSizeBytes = fileSizeBytes,
            MimeType = mimeType,
            DocumentType = documentType,
            CustomerId = customerId,
            UploadedByUserId = uploadedByUserId,
            Description = description,
            IsRequired = isRequired,
            ExpiryDate = expiryDate,
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

    public bool IsExpired => ExpiryDate.HasValue && ExpiryDate.Value < DateTime.UtcNow;

    public void VerifyDocument(bool isVerified, string? verificationNotes = null)
    {
        IsVerified = isVerified;
        VerificationNotes = verificationNotes;
        SetUpdated();
    }

    public void SetVerification(bool isVerified, long assessorId, string? verificationNotes = null)
    {
        IsVerified = isVerified;
        VerifiedByUserId = isVerified ? assessorId : null;
        VerificationNotes = verificationNotes;
        SetUpdated();
    }
}
