using MohamedTransit.Domain.Common;

namespace MohamedTransit.Domain.Entities;

public class Privilege
{
    public long Id { get; set; }

    public string Action { get; private set; } = string.Empty;

    public string Description { get; private set; } = string.Empty;

    public RecordStatus RecordStatus { get; set; } = RecordStatus.Active;

    public static Privilege Create(string action, string description)
    {
        return new Privilege
        {
            Action = action,
            Description = description,
            RecordStatus = RecordStatus.Active
        };
    }

    public void Update(string action, string description, RecordStatus? status = null)
    {
        Action = action;
        Description = description;
        if (status.HasValue)
        {
            RecordStatus = status.Value;
        }   }
    public void UpdateStatus(RecordStatus recordStatus)
    {
        RecordStatus = recordStatus;
    }
}
