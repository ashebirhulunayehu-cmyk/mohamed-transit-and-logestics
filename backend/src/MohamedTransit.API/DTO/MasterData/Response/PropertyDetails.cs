using MohamedTransit.Domain.Common;
namespace MohamedTransit.API;

public class PropertyDetails
{
    public long Id { get; set; }
    public string Subcity { get; set; }
    public string City { get; set; }
    public string RelativeAddress { get; set; }
    public string Woreda { get; set; }
    public string HouseNo { get; set; }
    public string BedRooms { get; set; }
    public string BathRooms { get; set; }
    public PropertyType PropertyType { get; set; }
    public string CompletionRate { get; set; }
    public string PropertyValue { get; set; }
    public bool HaveDigitalMap { get; set; }
    public bool Negotiability { get; set; }
    public string FacingNews { get; set; }
    public Dictionary<string, string>? Amenities { get; set; } = new Dictionary<string, string>();
    public Dictionary<string, string>? MapInfo { get; set; } = new Dictionary<string, string>();
    public Dictionary<string, string>? Utility { get; set; } = new Dictionary<string, string>();
    //public MapInfo? MapInfo { get; set; } = new MapInfo();
    //public Utility? Utility { get; set; } = new Utility();
    public bool AvailableForBankRequest { get; set; }
    public string Description { get; set; }
    public bool AccessibleForCRO { get; set; }
    public int FloorLevel { get; set; }
    public int NumberOfFloor { get; set; }
    public long CategoryId { get; set; }
    public long StoreId { get; set; }
    public long UserId { get; set; }
    public PropertyStatus PropertyStatus { get; set; }
    public DateTime StatusChangeDate { get; set; }
    public double AgentCommission { get; set; }
    public double StoreCommission { get; set; }
    public int NumberOfView { get; set; }
    public bool IsRealEstate { get; set; }
    public Usage Usage { get; set; }
}
public class MapInfo
{
    public string Latitude { get; set; }
    public string Longitude { get; set; }
    // Add other properties as needed
}

public class Utility
{
    public string Electricity { get; set; }
    public string Water { get; set; }
    public string Internet { get; set; }
    // Add other properties as needed
}
