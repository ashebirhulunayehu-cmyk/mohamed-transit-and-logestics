namespace MohamedTransit.API;

public class OrderDetail
{
    public long Id { get; set; }
    public string Name { get; set; }
    public string Phone { get; set; }
    public string Email { get; set; }
    public string Message { get; set; }
    public long PropertyId { get; set; }
    public long UserId { get; set; }
    public Dictionary<string, string> Remark { get; set; }
}
