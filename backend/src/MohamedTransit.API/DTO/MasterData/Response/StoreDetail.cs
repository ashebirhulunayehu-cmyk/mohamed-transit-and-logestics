namespace MohamedTransit.API;

public class StoreDetail
{
    public long Id { get; set; }
    public string Name { get; set; }
    public int MaxUser { get; set; }
    public string Subcity { get; set; }
    public string City { get; set; }
    public string RelativeAddress { get; set; }
    public string Woreda { get; set; }
    public string HouseNo { get; set; }
    public Dictionary<string, string> MapInfo { get; set; }
    public List<long> PropertyIds { get; set; }
    public List<long> UserIds { get; set; }
}
