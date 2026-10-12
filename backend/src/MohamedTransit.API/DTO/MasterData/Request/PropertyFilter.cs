namespace MohamedTransit.API;

public class PropertyFilter
{
    public string? Category { get; set; }
    public string? City { get; set; }
    public string? SubCity { get; set; }
    public int? MinPrice { get; set; }
    public int? MaxPrice { get; set; }
    public string PropertyType { get; set; }
    public int? MinViewCount { get; set; }
    public bool? RecentlyPosted { get; set; }

    // Range-based filters for NoOfBedRoom and NoOfBathroom
    public int? MinNoOfBedRoom { get; set; }
    public int? MaxNoOfBedRoom { get; set; }
    public int? MinNoOfBathroom { get; set; }
    public int? MaxNoOfBathroom { get; set; }
}
