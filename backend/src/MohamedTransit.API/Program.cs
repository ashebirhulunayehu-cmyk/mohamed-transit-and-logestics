using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MohamedTransit.Api.Middleware;
using MohamedTransit.API;
using MohamedTransit.API.Services;
using MohamedTransit.Application;
using MohamedTransit.Application.DataSeeder;
using MohamedTransit.Application.Helper;
using MohamedTransit.Application.Options;
using MohamedTransit.Application.Service;
using MohamedTransit.Application.Services;
using MohamedTransit.Domain.Data;

using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    ContentRootPath = AppContext.BaseDirectory,
    WebRootPath = Path.Combine(AppContext.BaseDirectory, "wwwroot")
});

// 4.b Email settings validation - fail fast if sender is not configured
// Bind the Settings object to the top-level "Settings" configuration section
// because appsettings.json nests EmailSettings inside "Settings".
builder.Services.AddOptions<Settings>()
    .Bind(builder.Configuration.GetSection("Settings"))
    .Validate(s => s != null
                   && s.EmailSettings != null
                   && !string.IsNullOrWhiteSpace(s.EmailSettings.Sender),
              "EmailSettings.EmailSettings.Sender must be configured")
    .ValidateOnStart();

// 1. Controllers & Global Filters
builder.Services.AddControllers()
    .AddJsonOptions(options =>
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles);

builder.Services.AddHttpContextAccessor();
// EndToEndTest ን በ DI Container ውስጥ ማስመዝገብ
builder.Services.AddScoped<MohamedTransit.API.TestScripts.EndToEndTest>();
builder.Services.AddScoped<IMessagingService, MessagingService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
// 2. Application & MediatR Architecture Setup
builder.Services.AddApplication();
builder.Services.AddScoped<IDataSeederService, DataSeederService>();

// 3. Application Services Registration
builder.Services.AddScoped<IFileStorageService, FileStorageService>();
builder.Services.AddScoped<TokenHandlerService>();
builder.Services.AddScoped<PasswordService>();
builder.Services.AddScoped<EmailSenderService>();
// 4. JWT Options Registration & Early Validation
builder.Services.AddOptions<JwtSettings>()
    .Bind(builder.Configuration.GetSection("JwtSettings"))
    .Validate(settings =>
        !string.IsNullOrWhiteSpace(settings.SigningKey) && settings.SigningKey.Length >= 32,
        "JwtSettings.SigningKey is missing or shorter than 32 characters.")
    .ValidateOnStart();

// 4.a JWT Authentication Configuration
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwtSettings = builder.Configuration
            .GetSection("JwtSettings")
            .Get<JwtSettings>() ?? new JwtSettings();

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSettings.SigningKey)
            ),
            ValidateIssuer = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidateAudience = true,
            ValidAudience = "MohamedTransitApp",
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });
// 5. OpenAPI / Scalar Documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

// 6. Environment-Aware Database Configuration
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    if (builder.Environment.IsDevelopment())
    {
        var configuredConnection = builder.Configuration.GetConnectionString("DevelopmentConnection")
            ?? throw new InvalidOperationException("The DevelopmentConnection connection string is not configured.");
        var sqliteConnection = new SqliteConnectionStringBuilder(configuredConnection);
        if (sqliteConnection.DataSource != ":memory:" && !Path.IsPathRooted(sqliteConnection.DataSource))
        {
            sqliteConnection.DataSource = Path.GetFullPath(sqliteConnection.DataSource, AppContext.BaseDirectory);
        }

        options.UseSqlite(sqliteConnection.ConnectionString);
    }
    else
    {
        options.UseNpgsql(builder.Configuration.GetConnectionString("ProductionConnection"));
    }
});

// 7. Global Exception Handling
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

// 8. Enhanced Mobile & Web CORS Policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowClientApplications", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:3000",
                "http://localhost:3001",
                "http://localhost:5000",
                "http://localhost:5002",
                "https://localhost:5002",
                "http://localhost:8081",
                "http://10.0.2.2:7236"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()
            .WithExposedHeaders("Content-Disposition", "Content-Length", "Content-Type");
    });
});

var app = builder.Build();

// 9. Auto-Database Migration & Admin Privilege Seeding
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    db.Database.Migrate();
    AdminPrivilegeSeeder.Seed(scope.ServiceProvider);
    if (app.Environment.IsDevelopment())
    {
        await scope.ServiceProvider.GetRequiredService<IDataSeederService>().SeedAsync();
    }
}

// 10. Profile Photo Static File Mapping Configuration
var webRootPath = app.Environment.WebRootPath ?? Path.Combine(app.Environment.ContentRootPath, "wwwroot");
var profilePhotoPath = Path.Combine(webRootPath, "Profile_Photo");

if (!Directory.Exists(profilePhotoPath))
{
    Directory.CreateDirectory(profilePhotoPath);
}

// 11. Middleware Execution Pipeline
app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
    {
        options.WithTitle("Mohamed Transit API")
               .WithTheme(ScalarTheme.Purple);
    });
    app.UseDeveloperExceptionPage(); // ይህ ስህተቱን በዝርዝር ያሳየዎታል
}
else
{
    app.UseHttpsRedirection();
}

app.UseStaticFiles();
app.UseCors("AllowClientApplications");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
await app.RunAsync();
