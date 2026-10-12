namespace MohamedTransit.API.DTO.MOT.Response;

public class ServiceStatisticsReport
{
    public int TotalServices { get; set; }
    public int CompletedServices { get; set; }
    public int PendingServices { get; set; }
    public int InProgressServices { get; set; }
    public int RejectedServices { get; set; }
    public double AverageProcessingTime { get; set; }
    public double CompletionRate { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public class MonthlyServiceReport
{
    public int Year { get; set; }
    public int Month { get; set; }
    public int TotalServices { get; set; }
    public int CompletedServices { get; set; }
    public int PendingServices { get; set; }
    public int InProgressServices { get; set; }
    public int RejectedServices { get; set; }
    public double CompletionRate { get; set; }
}

public class CustomerStatisticsReport
{
    public int TotalCustomers { get; set; }
    public int VerifiedCustomers { get; set; }
    public int PendingCustomers { get; set; }
    public double VerificationRate { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public class SystemReport
{
    public int TotalServices { get; set; }
    public int CompletedServices { get; set; }
    public int TotalCustomers { get; set; }
    public int VerifiedCustomers { get; set; }
    public int TotalDocuments { get; set; }
    public int TotalMessages { get; set; }
    public double ServiceCompletionRate { get; set; }
    public double CustomerVerificationRate { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime GeneratedDate { get; set; }
}

