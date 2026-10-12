using MohamedTransit.Domain.Common;

namespace MohamedTransit.Domain;

public class BaseEntity
{
    public long Id { get; protected set; }

    // Audit Fields
    public DateTime CreateAt { get; protected set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; protected set; }
    public RecordStatus RecordStatus { get; set; } // Capitalized for consistency

    protected BaseEntity()
    {
        Id = 0; // Will be set by the database  
        CreateAt = DateTime.UtcNow;
    }

    public void SetUpdated()
    {
        UpdatedAt = DateTime.UtcNow;
    }
}
