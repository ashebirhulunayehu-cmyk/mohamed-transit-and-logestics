using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

using MohamedTransit.Domain.Common;



namespace MohamedTransit.API;

public class StoreRequest
{
    public long? Id { get; set; }
    public string Name { get; set; }
    public string Subcity { get; set; }
    /// <summary>
    /// Gets or sets the logo file to be uploaded for the Store.
    /// </summary>
    [Required]
    public IFormFile ImageFile { get; set; } // For file upload, changed to non-nullable

    /// <summary>
    /// Gets or sets the path where the logo will be saved, not to be set by the client.
    /// </summary>
    [JsonIgnore]
    public string? Url { get; set; } // For the path after saving, server-side only

    public string City { get; set; }
    public string RelativeAddress { get; set; }
    public bool IsRealEstate { get; set; } = false;
    public string Woreda { get; set; }
    public string HouseNo { get; set; }

    public Dictionary<string, string> MapInfo { get; set; }
    [Range(1, 20, ErrorMessage = "Maximum number of users allowed per store is 20.")]
    public int MaxUser { get; set; }
    public IEnumerable<long> UserIds { get; set; }
}
public class StoreUpdateRequest
{
    public long? Id { get; set; }
    public string Name { get; set; }

    [Range(1, 20, ErrorMessage = "Maximum number of users allowed per store is 20.")]
    public int MaxUser { get; set; }

    public string Subcity { get; set; }
    public string City { get; set; }
    public string RelativeAddress { get; set; }
    public string Woreda { get; set; }
    public string HouseNo { get; set; }

    public Dictionary<string, string> MapInfo { get; set; }
    public IEnumerable<long> UserIds { get; set; }
    public RecordStatus? RecordStatus { get; set; }
    /// <summary>
    /// Gets or sets the logo file to be uploaded for the Store.
    /// </summary>
    public IFormFile? ImageFile { get; set; } // For file upload, changed to non-nullable

    /// <summary>
    /// Gets or sets the path where the logo will be saved, not to be set by the client.
    /// </summary>
    [JsonIgnore]
    public string? Url { get; set; } // For the path after saving, server-side only


    public bool IsRealEstate { get; set; } = false;

}
