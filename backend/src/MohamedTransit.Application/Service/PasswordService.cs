using MohamedTransit.Application.Service;
namespace MohamedTransit.Application.Service;

public class PasswordService
{
    public string HashPassword(string password) => BCrypt.Net.BCrypt.HashPassword(password);
    public bool ValidatePassword(string encrypted, string password)
     => BCrypt.Net.BCrypt.Verify(password,encrypted);

}
