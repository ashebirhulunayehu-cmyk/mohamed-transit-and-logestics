using System.Net;

namespace MohamedTransit.Application.Helper;

[Serializable]
public class OperationStatusResponse
{
    public string? Message { get; set; }
    public HttpStatusCode StatusCode { get; set; }
}

public class FileUploadResponse : OperationStatusResponse
{
    public string? FilePath { get; set; }
}

public class FileStreamProcessResponse : OperationStatusResponse
{
    public byte[]? File { get; set; }
}
