using MohamedTransit.Domain.Common;

namespace MohamedTransit.Domain.Entities;

public class StageComment : BaseEntity
{
    public string Comment { get; private set; } = string.Empty;
    public long? ServiceStageId { get; private set; }
    public long? CommentedByUserId { get; private set; }

    // Navigation Properties
    public ServiceStageExecution? ServiceStage { get; set; }
    public User? CommentedByUser { get; set; }

    private StageComment() { } // For EF Core

    public static StageComment Create(string comment, long serviceStageId, long commentedByUserId)
    {
        return new StageComment
        {
            Comment = comment,
            ServiceStageId = serviceStageId,
            CommentedByUserId = commentedByUserId,
            RecordStatus = RecordStatus.Active
        };
    }
}
