namespace MohamedTransit.Application.Helper;

public class Settings
{
    public EmailSettings EmailSettings { get; set; } = new();
    public AzureStorageConfig AzureStorageConfig { get; set; } = new();
}

public class EmailSettings
{
    public string MailServer { get; set; } = string.Empty;
    public int MailPort { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string Sender { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class AzureStorageConfig
{
    public string AccountName { get; set; } = string.Empty;
    public string ImageContainer { get; set; } = string.Empty;
    public string AccountKey { get; set; } = string.Empty;
}
