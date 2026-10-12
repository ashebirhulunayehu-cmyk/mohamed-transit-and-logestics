namespace MohamedTransit.Application.DTO
{
    public class ServiceDto
    {
        // 1. የ Id ዓይነት long መሆን አለበት (ከ Service ኤንቲቲ ጋር እንዲመሳሰል)
        public long Id { get; set; }

        // 2. አዲሶቹ እና ትክክለኞቹ ፊልዶች
        public string Reference { get; set; } = string.Empty;
        public string ContactPerson { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
        public long ImporterId { get; set; }
    }
}
