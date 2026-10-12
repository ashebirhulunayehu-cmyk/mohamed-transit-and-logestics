using MediatR;

using Microsoft.AspNetCore.Http; // <--- ይህ ተጨምሯል

using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.Application.Commands.UserAccount;

public class CreateUserCommand : IRequest<OperationResult<User>>
{
    public string Username { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    // ፋይሉን ከ API Form-Data ለመቀበል የሚያስችል ፕሮፐርቲ
    public IFormFile? ProfileFile { get; set; }

    public string ProfilePhoto { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public bool IsSuperAdmin { get; set; } = false;

    public List<long> Roles { get; set; } = new();
}
