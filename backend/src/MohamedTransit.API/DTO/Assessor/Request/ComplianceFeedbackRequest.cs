namespace MohamedTransit.API.DTO.NewFolder.Request
{
    public class ComplianceFeedbackRequest
    {
        public long ShipmentId { get; set; }
        public string Feedback { get; set; } = string.Empty;
    

}
}
