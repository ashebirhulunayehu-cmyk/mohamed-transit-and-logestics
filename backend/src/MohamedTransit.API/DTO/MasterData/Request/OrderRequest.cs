using MohamedTransit.Domain.Common;

namespace Transit.API;

public class OrderRequest
{
    public string? Name { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }

    public string Message { get; set; }
    public long PropertyId { get; set; }
    public long? UserId { get; set; }

    public Dictionary<string, string> Remark { get; set; } = new Dictionary<string, string>();
}
public class OrderUpdateRequest
{
    public long Id { get; set; }
    public string Name { get; set; }
    public string Phone { get; set; }
    public string Email { get; set; }
    public string Message { get; set; }
    public long PropertyId { get; set; }
    public Dictionary<string, string> Remark { get; set; } = new Dictionary<string, string>();

    public OrderStatus OrderStatus { get; set; }
}
