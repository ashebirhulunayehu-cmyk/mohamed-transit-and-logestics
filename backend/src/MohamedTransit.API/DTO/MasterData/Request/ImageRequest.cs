namespace Transit.API;

public class ImageRequest
{
    public List<IFormFile> Images { get; set; }
    public long PropertyId { get; set; }
}
public class UpdateImageRequest
{
    public long Id { get; set; }
    public string Name { get; set; }
    public IFormFile Url { get; set; }
    public long PropertyId { get; set; }
}
