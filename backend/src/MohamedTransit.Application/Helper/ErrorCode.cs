namespace MohamedTransit.Application.Helper;

public enum ErrorCode
{
    UnAuthorized = 401,
    NotFound = 404,
    ServerError = 500,
    RecordFound = 409,

    // Validation errors: 100 - 199
    ValidationError = 101,

    // Infrastructure errors: 200 - 299
    IdentityCreationFailed = 202,

    // Application errors: 300 - 399
    PostUpdateNotPossible = 300,
    PostDeleteNotPossible = 301,
    InteractionRemovalNotAuthorized = 302,
    UserAlreadyExists = 303,
    UserDoesNotExist = 304,
    IncorrectPassword = 305,
    UnauthorizedAccountRemoval = 306,
    CommentRemovalNotAuthorized = 307,

    UnknownError = 999,

    Ok = 200
}
