using System.Text;
using Microsoft.Extensions.Options;
using MohamedTransit.Application.Options;

namespace MohamedTransit.API.Validation;

public class JwtSettingsValidator : IValidateOptions<JwtSettings>
{
    public ValidateOptionsResult Validate(string name, JwtSettings options)
    {
        if (options == null)
            return ValidateOptionsResult.Fail("JwtSettings configuration is missing.");

        if (string.IsNullOrWhiteSpace(options.SigningKey))
            return ValidateOptionsResult.Fail("JwtSettings.SigningKey is required and cannot be empty.");

        var keyBytes = Encoding.UTF8.GetBytes(options.SigningKey);
        if (keyBytes.Length == 0)
            return ValidateOptionsResult.Fail("JwtSettings.SigningKey byte length is zero.");

        // Recommend a minimum length (e.g., 32 bytes ~ 256 bits) for HS256
        if (keyBytes.Length < 32)
            return ValidateOptionsResult.Fail("JwtSettings.SigningKey is too short. Use a key at least 32 bytes long.");

        return ValidateOptionsResult.Success;
    }
}
