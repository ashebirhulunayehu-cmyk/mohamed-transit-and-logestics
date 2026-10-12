namespace MohamedTransit.API.DTO.NewFolder.Request
{
    public class ShipmentReviewRequest
    {

        public long ShipmentId { get; set; }
        public bool IsApproved { get; set; }
        public string? ReviewNotes { get; set; }

    }
}
