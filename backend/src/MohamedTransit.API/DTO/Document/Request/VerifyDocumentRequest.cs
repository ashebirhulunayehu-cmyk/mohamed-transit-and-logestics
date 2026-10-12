namespace MohamedTransit.Api.DTO.Document.Request;

public class VerifyDocumentRequest
{
    public long DocumentId { get; set; }
    public bool IsVerified { get; set; }
    public string? VerificationNotes { get; set; }
}


