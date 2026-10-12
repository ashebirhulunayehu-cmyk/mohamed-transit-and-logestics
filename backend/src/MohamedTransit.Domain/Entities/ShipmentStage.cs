using MohamedTransit.Domain.Common;

namespace MohamedTransit.Domain.Entities;

public class ServiceStageExecution : BaseEntity
{
    private readonly List<StageDocument> _documents = new List<StageDocument>();
    private readonly List<StageComment> _comments = new List<StageComment>();

    public ShipmentStage Stage { get; private set; }
    public StageStatus Status { get; private set; }
    public InspectionType? InspectionType { get; private set; }
    public StageSpot? StageSpot { get; private set; }
    public string? Comments { get; private set; }
    public string? SpotComment { get; private set; }
    public DateTime? StartedAt { get; private set; }
    public DateTime? CompletedAt { get; private set; }
    public string? AssignedTo { get; private set; }
    public string? RiskNotes { get; private set; }
    public bool RequiresCustomerAction { get; private set; }
    public bool IsBlocked { get; private set; }
    public string? BlockReason { get; private set; }

    // Foreign Keys
    public long? ShipmentId { get; private set; }
    public long? UpdatedByUserId { get; private set; }

    // Navigation Properties
    public Shipment? Shipment { get; set; }
    public User? UpdatedByUser { get; set; }

    public IReadOnlyCollection<StageDocument> Documents => _documents.AsReadOnly();
    public IReadOnlyCollection<StageComment> StageComments => _comments.AsReadOnly();

    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

    private ServiceStageExecution() { }

    public static ServiceStageExecution Create(
        long serviceId,
        ShipmentStage stage,
        long? updatedByUserId = null)
    {
        return new ServiceStageExecution
        {
            ShipmentId = serviceId,
            Stage = stage,
            Status = StageStatus.NotStarted,
            UpdatedByUserId = updatedByUserId,
            RecordStatus = RecordStatus.Active
        };
    }

    public void UpdateStatus(StageStatus status, string? comments = null)
    {
        Status = status;
        Comments = comments;

        if (status == StageStatus.InProgress && !StartedAt.HasValue)
        {
            StartedAt = DateTime.UtcNow;
        }

        if (status == StageStatus.Completed && !CompletedAt.HasValue)
        {
            CompletedAt = DateTime.UtcNow;
        }

        SetUpdated();
    }

    public void SetBlocked(bool isBlocked, string? reason = null)
    {
        IsBlocked = isBlocked;
        BlockReason = reason;
        SetUpdated();
    }

    public void SetCustomerActionRequired(bool required)
    {
        RequiresCustomerAction = required;
        SetUpdated();
    }

    public void AddRiskNotes(string notes)
    {
        RiskNotes = notes;
        SetUpdated();
    }

    public void AddDocument(StageDocument document)
    {
        ArgumentNullException.ThrowIfNull(document);
        _documents.Add(document);
    }

    public void AddComment(StageComment comment)
    {
        ArgumentNullException.ThrowIfNull(comment);
        _comments.Add(comment);
    }
}
