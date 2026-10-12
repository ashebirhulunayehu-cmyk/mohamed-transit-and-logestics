namespace MohamedTransit.API.DTO.Assessor.Request;

public class VerifyCustomerDocumentDto
{
    public long DocumentId { get; set; }
    public bool IsVerified { get; set; }
    public string? Notes { get; set; }
}
