using MohamedTransit.Application.Options;
using MohamedTransit.API.Validation;
using Xunit;

namespace MohamedTransit.UnitTests;

public class JwtSettingsValidatorTests
{
    [Fact]
    public void Validate_NullOptions_Fails()
    {
        var validator = new JwtSettingsValidator();
        var result = validator.Validate(string.Empty, null);
        Assert.False(result.Succeeded);
    }

    [Fact]
    public void Validate_EmptySigningKey_Fails()
    {
        var validator = new JwtSettingsValidator();
        var options = new JwtSettings { SigningKey = string.Empty };
        var result = validator.Validate(string.Empty, options);
        Assert.False(result.Succeeded);
    }

    [Fact]
    public void Validate_ShortSigningKey_Fails()
    {
        var validator = new JwtSettingsValidator();
        var options = new JwtSettings { SigningKey = "short-key" };
        var result = validator.Validate(string.Empty, options);
        Assert.False(result.Succeeded);
    }

    [Fact]
    public void Validate_ValidSigningKey_Succeeds()
    {
        var validator = new JwtSettingsValidator();
        // 32 chars -> 32 bytes in UTF8 for ASCII chars
        var options = new JwtSettings { SigningKey = new string('a', 32) };
        var result = validator.Validate(string.Empty, options);
        Assert.True(result.Succeeded);
    }
}
