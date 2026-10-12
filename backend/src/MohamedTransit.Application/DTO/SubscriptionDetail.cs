namespace MohamedTransit.Application.DTO 
{
    public class SubscriptionDetail
    {
        public long Id { get; set; }
        public string PlanName { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsActive { get; set; }
    }
}
