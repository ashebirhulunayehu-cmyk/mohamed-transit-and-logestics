using MohamedTransit.Domain.Common;



namespace MohamedTransit.API;

public class CategoryRequest
{
    public long Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
}
public class CategoryUpdateRequest
{
    public long? Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public RecordStatus? RecordStatus { get; set; }

}
