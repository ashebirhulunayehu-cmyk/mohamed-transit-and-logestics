using Mapster;
using MohamedTransit.Domain.Entities;
namespace MohamedTransit.API.DTO.MOT.Response;
public class DataEncoderDashboardResponse
{
   public int TotalCustomersCreated { get; set; }
    public int PendingCustomerApprovals { get; set; }
    public int TotalServicesCreated { get; set; }
    public int PendingServiceApprovals { get; set; }
    public int DraftServices { get; set; }
    public int DueWithin48Hours { get; set; }
    public List<Customer> RecentCustomers { get; set; } = new();
    public List<ShipmentDetail> RecentServices { get; set; } = [];
}

