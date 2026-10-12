namespace MohamedTransit.API.DTO.Shipment.Request;

public class AssignShipmentRequest
{
    public long ShipmentId { get; set; }
    public long AssignedCaseExecutorId { get; set; }
    public long AssignedAssessorId { get; set; }
    public string? AssignmentNotes { get; set; }
}

