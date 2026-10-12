using System.Collections.Generic;

using MohamedTransit.Domain.Entities;

// የ Namespace እና የ Shipment Entity ግጭትን ለመፍታት Alias መጠቀም
using ShipmentEntity = MohamedTransit.Domain.Entities.Shipment;

namespace MohamedTransit.API.DTO.MOT.Response;

public class AssessorDashboardResponse
{
    public int PendingCustomerApprovals { get; set; }
    public int PendingServiceReviews { get; set; }
    public int ServicesUnderOversight { get; set; }
    public int CompletedReviewsToday { get; set; }
    public List<Customer> RecentCustomerApprovals { get; set; } = new();
    public List<ShipmentEntity> RecentServiceReviews { get; set; } = new();
}
