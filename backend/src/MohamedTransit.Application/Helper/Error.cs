using MohamedTransit.Domain.Common;

namespace MohamedTransit.Application.Helper;

public class Error
{
    public Error()
    {
    }

    public Error(string v1, string v2)
    {
        Message = v2;
    }

    public Error(ErrorCode code, string message)
    {
        Code = code;
        Message = message;
    }

    public ErrorCode Code { get; set; }

    public string Message { get; set; } = string.Empty;
}
