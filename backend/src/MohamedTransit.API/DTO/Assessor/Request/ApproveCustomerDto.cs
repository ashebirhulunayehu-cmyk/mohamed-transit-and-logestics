namespace MohamedTransit.API.DTO.NewFolder.Request
{
    public class ApproveCustomerDto
    {
        public long CustomerId { get; set; }
        public bool IsApproved { get; set; }
        public bool ReturnForRevision { get; set; }
        public string? Notes { get; set; }
    }
}
