namespace MohamedTransit.API;

public class FeedBackResponse
{
    public long Id { get; set; }
    public string Message { get; set; }
    public DateTime RecordDate { get; set; }
    public string? FullName { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
}
