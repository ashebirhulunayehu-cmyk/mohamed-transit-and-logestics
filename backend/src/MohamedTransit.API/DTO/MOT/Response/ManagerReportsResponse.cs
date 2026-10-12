namespace MohamedTransit.API.DTO.MOT.Response;

public class ManagerReportsResponse
{
    public int OpenCases { get; set; }
    public int CompletedYearToDate { get; set; }
    public double? OnTimeClearanceRate { get; set; }
    public double? AverageStageDurationHours { get; set; }
    public List<ManagerMonthlyThroughput> MonthlyThroughput { get; set; } = new();
    public List<ManagerRiskChannelCount> RiskChannels { get; set; } = new();
    public List<ManagerStageDuration> StageDurations { get; set; } = new();
    public List<ManagerExecutorPerformance> ExecutorPerformance { get; set; } = new();
}

public class ManagerMonthlyThroughput
{
    public int Year { get; set; }
    public int Month { get; set; }
    public int Multimodal { get; set; }
    public int Unimodal { get; set; }
    public int Completed { get; set; }
}

public class ManagerRiskChannelCount
{
    public string Channel { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class ManagerStageDuration
{
    public string Stage { get; set; } = string.Empty;
    public double AverageHours { get; set; }
}

public class ManagerExecutorPerformance
{
    public long ExecutorId { get; set; }
    public string ExecutorName { get; set; } = string.Empty;
    public int CasesClosed { get; set; }
    public double? AverageCycleDays { get; set; }
    public int OpenLoad { get; set; }
}
