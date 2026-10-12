using MohamedTransit.Domain.Entities;
using MohamedTransit.Domain.Common;

namespace MohamedTransit.API.DTO.MOT.Response;

public class ShipmentDetail
{
    public long Id { get; set; }
    public string ServiceNumber { get; set; } = string.Empty;
    public string ItemDescription { get; set; } = string.Empty;
    public string RouteCategory { get; set; } = string.Empty;
    public decimal DeclaredValue { get; set; }
    public string TaxCategory { get; set; } = string.Empty;
    public string CountryOfOrigin { get; set; } = string.Empty;
    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public ServiceType ServiceType { get; set; }
    public ShipmentStatus Status { get; set; }
    public RiskLevel? RiskLevel { get; set; }
    public long CustomerId { get; set; }
    public string ImporterName { get; set; } = string.Empty;
    public string ImporterTinNumber { get; set; } = string.Empty;
    public long? AssignedCaseExecutorId { get; set; }
    public long? AssignedAssessorId { get; set; }
    public DateTime RegisteredDate { get; set; }
    public DateTime? DueAt { get; set; }
    public DateTime? LastUpdateDate { get; set; }
}
