namespace MohamedTransit.Application.Helper;

public class ErrorResponse
{
    public bool Error { get; set; } = true;
    public int StatusCode { get; set; }
    public List<string> Errors { get; set; } = new List<string>();
    public string Message { get; set; } = string.Empty;
    public string Response { get; set; } = string.Empty;

    public ErrorResponse() { }

    public ErrorResponse(int statusCode, string message, List<string>? errors = null)
    {
        StatusCode = statusCode;
        Message = message;
        Error = true;
        if (errors != null) Errors = errors;
    }
}

public class ApiResponse<T>
{
    public int StatusCode { get; set; }
    public bool Error { get; set; }
    public List<string> Errors { get; set; } = new List<string>();
    public string Message { get; set; } = string.Empty;
    public Response<T>? Response { get; set; }

    public ApiResponse() { }

    public ApiResponse(T data, string message = "Success", int statusCode = 200)
    {
        StatusCode = statusCode;
        Error = false;
        Message = message;
        Response = new Response<T> { Data = data };
    }
}

public class Response<T>
{
    public T? Data { get; set; }
}
