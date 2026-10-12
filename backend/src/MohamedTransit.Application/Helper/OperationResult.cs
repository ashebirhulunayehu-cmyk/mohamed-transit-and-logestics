using MohamedTransit.Domain.Entities;

namespace MohamedTransit.Application.Helper;

public class OperationResult<T>
{
    public T? Payload { get; set; }

    public string Message { get; set; } = string.Empty;

    public bool IsError { get; private set; }

    public List<Error> Errors { get; } = new();

    public void AddError(ErrorCode code, string message)
    {
        HandleError(code, message);
    }

    public void AddUnknownError(string message)
    {
        HandleError(ErrorCode.UnknownError, message);
    }

    public void ResetIsErrorFlag()
    {
        IsError = false;
    }

    private void HandleError(ErrorCode code, string message)
    {
        Errors.Add(new Error
        {
            Code = code,
            Message = message
        });

        IsError = true;
    }

    // Existing project handlers need this
    public static OperationResult<T> Success(
        T data,
        string message = "Operation succeeded.")
    {
        return new OperationResult<T>
        {
            Payload = data,
            Message = message,
            IsError = false
        };
    }

    // Existing project handlers need this
    public static OperationResult<T> Failure(
        string message,
        ErrorCode? errorCode = null)
    {
        var result = new OperationResult<T>
        {
            Message = message,
            IsError = true
        };

        if (errorCode.HasValue)
        {
            result.AddError(errorCode.Value, message);
        }
        else
        {
            result.AddUnknownError(message);
        }

        return result;
    }

    public static OperationResult<T> Failure(List<Error> errors)
    {
        var result = new OperationResult<T>
        {
            IsError = true,
            Message = errors.FirstOrDefault()?.Message ?? "Operation failed."
        };

        foreach (var error in errors)
        {
            result.Errors.Add(error);
        }

        return result;
    }
}
