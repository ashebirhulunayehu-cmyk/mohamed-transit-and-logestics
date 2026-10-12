using MohamedTransit.Domain.Common;

namespace MohamedTransit.Application.DTO;

public class ReportModel
{
    public ReportModel()
    {
        ReportPerOrganization = new List<ReportPerOrganization>();
        InvoiceReport = new InvoiceReport();
    }
    public InvoiceReport InvoiceReport { get; set; }
    //public List<DocumentResponse> Documents { get; set; } = new List<DocumentResponse>();
    public List<ReportPerOrganization> ReportPerOrganization { get; set; }
}

public class ReportPerOrganization
{
    public OrganizationDetailDto Organization { get; set; }
    public SubscriptionDetail Subscription { get; set; }

    // RemainingPagesCount
    public int RemainingPagesCount { get; set; }

    public int TotalPagesQuota { get; set; }

    // Orders
    public int Orders { get; set; }

    // Users
    public int Users { get; set; }

    // Documents
    public int Documents { get; set; }

    // Documents Count
    public int PagesCount { get; set; }

    // TotalPrice
    public double TotalPrice { get; set; }
}

public class InvoiceReport
{
    public int Subscriptions { get; set; }

    // Organizations
    public int Organizations { get; set; }

    // Orders
    public int Orders { get; set; }

    // Users
    public int Users { get; set; }

    // Documents
    public int Documents { get; set; }

    // Documents Count
    public int PagesCount { get; set; }

    public double RemainingPagesCount { get; set; }

    public double TotalPagesQuota { get; set; }

    // TotalPrice
    public double TotalPrice { get; set; }
}
