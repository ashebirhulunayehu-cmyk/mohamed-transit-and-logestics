using MohamedTransit.Domain.Entities;

namespace MohamedTransit.API.DTO.MOT.Response;

public class ManagerDashboardResponse
{
    public int TotalServices { get; set; }
    public int PendingServices { get; set; }
    public int InProgressServices { get; set; }
    public int CompletedServices { get; set; }
    public int OpenCases { get; set; }
    public int NeedsAttention { get; set; }
    public int? DueWithin48Hours { get; set; }
    public int ClearedThisMonth { get; set; }
    public int TotalCustomers { get; set; }
    public int VerifiedCustomers { get; set; }
    public int TotalStaff { get; set; }
    public int ActiveStaff { get; set; }
    public List<ShipmentDetail> RecentServices { get; set; } = new();
    public List<MonthlyServiceStat> MonthlyServiceStats { get; set; } = new();
}

public class MonthlyServiceStat
{
    public int Year { get; set; }
    public int Month { get; set; }
    public int TotalServices { get; set; }
    public int CompletedServices { get; set; }
    public double CompletionRate { get; set; }
}

