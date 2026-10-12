using Google.Api;

using MohamedTransit.Domain.Common;

namespace MohamedTransit.API;

public class PropertyRequest
{
    public string Subcity { get; set; }
    public string City { get; set; }
    public string RelativeAddress { get; set; }
    public string Woreda { get; set; }
    public string HouseNo { get; set; }
    public string BedRooms { get; set; }
    public string BathRooms { get; set; }
    public Dictionary<string, string> Amenities { get; set; }
    public PropertyType PropertyType { get; set; }
    public string CompletionRate { get; set; }
    public string PropertyValue { get; set; }
    public bool HaveDigitalMap { get; set; }
    public bool IsRealEstate { get; set; }
    public Google.Api.Usage Usage { get; set; }
    public Dictionary<string, string> MapInfo { get; set; }
    public bool Negotiability { get; set; }
    public string FacingNews { get; set; }
    public Dictionary<string, string> Utility { get; set; }
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
}
public class UpdatePropertyRequest
{
    public long Id { get; set; }
    public string Subcity { get; set; }
    public string City { get; set; }
    public string RelativeAddress { get; set; }
    public string Woreda { get; set; }
    public string HouseNo { get; set; }
    public string BedRooms { get; set; }
    public string BathRooms { get; set; }
    public Dictionary<string, string> Amenities { get; set; }
    public PropertyType PropertyType { get; set; }
    public string CompletionRate { get; set; }
    public string PropertyValue { get; set; }
    public bool HaveDigitalMap { get; set; }
    public Dictionary<string, string> MapInfo { get; set; }
    public string? QR { get; set; }
    public bool Negotiability { get; set; }
    public string FacingNews { get; set; }
    public Dictionary<string, string> Utility { get; set; }
    public bool AvailableForBankRequest { get; set; }
    public string Description { get; set; }
    public bool AccessibleForCRO { get; set; }
    public int FloorLevel { get; set; }
    public int NumberOfFloor { get; set; }
    public long CategoryId { get; set; }
    public long StoreId { get; set; }
    public PropertyStatus PropertyStatus { get; set; }
    public DateTime StatusChangeDate { get; set; }
    public double AgentCommission { get; set; }
    public double StoreCommission { get; set; }
    public int NumberOfView { get; set; }
    public bool IsRealEstate { get; set; }
    public Google.Api.Usage Usage { get; set; }
}
