namespace MohamedTransit.API;

public class CustomerDetail
{
    public long Id { get; set; }
    public string BusinessName { get; private set; }
    public string TINNumber { get; private set; }
    public string BusinessLicense { get; private set; }
    public string BusinessAddress { get; private set; }
    public string City { get; private set; }
    public string State { get; private set; }
    public string PostalCode { get; private set; }
    public string ContactPerson { get; private set; }
    public string ContactPhone { get; private set; }
    public string ContactEmail { get; private set; }
    public string BusinessType { get; private set; }
    public string ImportLicense { get; private set; }
    public DateTime? ImportLicenseExpiry { get; private set; }
    public bool IsVerified { get; private set; }
    public DateTime? VerifiedAt { get; private set; }
    public long? VerifiedByUserId { get; private set; }
    public string? VerificationNotes { get; private set; }
    public int ActiveCases { get; set; }
    public DateTime RegisteredAt { get; set; }

    // Foreign Keys
    public long UserId { get; private set; }
}
