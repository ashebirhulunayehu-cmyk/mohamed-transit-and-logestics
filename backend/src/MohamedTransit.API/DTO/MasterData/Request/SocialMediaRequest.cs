namespace MohamedTransit.API;

public class SocialMediaRequest
{
    public string FacebookLink { get; set; }
    public string InstagramLink { get; set; }
    public string LinkedinLink { get; set; }
    public string XLink { get; set; }
    public long UserId { get; set; }
}
public class SocialMediaUpadetRequest
{
    public long Id { get; set; }
    public string FacebookLink { get; set; }
    public string InstagramLink { get; set; }
    public string LinkedinLink { get; set; }
    public string XLink { get; set; }
}
