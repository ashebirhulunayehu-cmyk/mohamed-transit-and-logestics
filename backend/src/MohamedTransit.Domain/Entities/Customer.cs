using MohamedTransit.Domain;
using MohamedTransit.Domain.Common;
namespace MohamedTransit.Domain.Entities;
public class Customer : BaseEntity
{
    private readonly List<CustomerDocument> _documents = new List<CustomerDocument>();
public string BusinessName { get; private set; } = string.Empty;
    public string TINNumber { get; private set; } = string.Empty;
    public string BusinessLicense { get; private set; } = string.Empty;
    public string BusinessAddress { get; private set; } = string.Empty;
    public DateTime? StartDate { get; private set; }
    public string City { get; private set; } = string.Empty;
    public string State { get; private set; } = string.Empty;
    public string PostalCode { get; private set; } = string.Empty;

   public string ContactPerson { get; private set; } = string.Empty;
    public string ContactPhone { get; private set; } = string.Empty;
    public string ContactEmail { get; private set; } = string.Empty;
    public string BusinessType { get; private set; } = string.Empty;
    public string ImportLicense { get; private set; } = string.Empty;
    public DateTime? ImportLicenseExpiry { get; private set; }
    public bool IsVerified { get; private set; }
    public bool IsReturnedForRevision { get; private set; }
    public DateTime? VerifiedAt { get; private set; }
    public long? VerifiedByUserId { get; private set; }
    public string? VerificationNotes { get; private set; }

    // Foreign Keys
    public long? UserId { get; private set; }
    public long CreatedByDataEncoderId { get; private set; }

    // Navigation Properties
    public User User { get; set; }
    public User CreatedByDataEncoder { get; set; }
    public User? VerifiedByUser { get; set; }

    public ICollection<CustomerDocument> Documents => _documents;

    public static Customer Create(
        string businessName,
        string tinNumber,
        string businessLicense,
        string businessAddress,
        string city,
        string state,
        string postalCode,
        string contactPerson,
        string contactPhone,
        string contactEmail,
        string businessType,
        string importLicense,
        DateTime? importLicenseExpiry,
        long userId,
        long createdByDataEncoderId,
        DateTime? startDate = null)
    {
        return new Customer
        {
            BusinessName = businessName,
            TINNumber = tinNumber,
            BusinessLicense = businessLicense,
            BusinessAddress = businessAddress,
            City = city,
            State = state,
            PostalCode = postalCode,
            ContactPerson = contactPerson,
            ContactPhone = contactPhone,
            ContactEmail = contactEmail,
            BusinessType = businessType,
            ImportLicense = importLicense,
            ImportLicenseExpiry = importLicenseExpiry,
            UserId = userId,
            CreatedByDataEncoderId = createdByDataEncoderId,
            IsVerified = false,
            RecordStatus = RecordStatus.Active
        };
    }

    public void Verify(long verifiedByUserId, string? notes = null)
    {
        IsVerified = true;
        IsReturnedForRevision = false;
        VerifiedAt = DateTime.UtcNow;
        VerifiedByUserId = verifiedByUserId;
        VerificationNotes = notes;
        RecordStatus = RecordStatus.Active;
        SetUpdated();
    }

    public void ReturnForRevision(string notes)
    {
        IsVerified = false;
        IsReturnedForRevision = true;
        VerifiedByUserId = null;
        VerifiedAt = null;
        RecordStatus = RecordStatus.Active;
        VerificationNotes = notes;
        SetUpdated();
    }

    public void RejectVerification(string? notes = null)
    {
        IsVerified = false;
        IsReturnedForRevision = false;
        VerifiedByUserId = null;
        VerifiedAt = null;
        RecordStatus = RecordStatus.InActive;
        VerificationNotes = notes;
        SetUpdated();
    }

    public void UpdateBusinessInfo(
        string businessName,
        string businessAddress,
        string city,
        string state,
        string postalCode,
        string contactPerson,
        string contactPhone,
        string contactEmail)
    {
        BusinessName = businessName;
        BusinessAddress = businessAddress;
        City = city;
        State = state;
        PostalCode = postalCode;
        ContactPerson = contactPerson;
        ContactPhone = contactPhone;
        ContactEmail = contactEmail;
        IsReturnedForRevision = false;
        SetUpdated();
    }

    public void AddDocument(CustomerDocument document)
    {
        _documents.Add(document);
    }
}
