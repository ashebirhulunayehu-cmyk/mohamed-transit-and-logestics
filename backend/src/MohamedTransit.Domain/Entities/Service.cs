namespace MohamedTransit.Domain.Entities
{
    public class Service
    {
        public long Id { get; set; }
public string Reference { get; set; } = string.Empty;
        public string ContactPerson { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;

        public long ImporterId { get; set; }
    }
}
