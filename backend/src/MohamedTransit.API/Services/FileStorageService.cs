using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;

namespace MohamedTransit.API.Services;

public interface IFileStorageService
{
    Task<string> SaveFileAsync(IFormFile file, string folder, string? customFileName = null);
    Task<bool> DeleteFileAsync(string filePath);
    Task<byte[]> GetFileAsync(string filePath);
    string GetFileUrl(string filePath);
    bool FileExists(string filePath);
}

public class FileStorageService : IFileStorageService
{
    private readonly IWebHostEnvironment _environment;
    private readonly IConfiguration _configuration;

    public FileStorageService(IWebHostEnvironment environment, IConfiguration configuration)
    {
        _environment = environment;
        _configuration = configuration;
    }

    public async Task<string> SaveFileAsync(IFormFile file, string folder, string? customFileName = null)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("File is empty or null");

        // Validate file type
        var allowedExtensions = new[] { ".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx", ".xls", ".xlsx" };
        var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();

        if (!allowedExtensions.Contains(fileExtension))
            throw new ArgumentException($"File type {fileExtension} is not allowed");

        // Match the Data Encoder service wizard's document size limit.
        if (file.Length > 25 * 1024 * 1024)
            throw new ArgumentException("File size exceeds 25MB limit");

        // Create directory if it doesn't exist
        var uploadsFolder = Path.Combine(_environment.WebRootPath, folder);
        Directory.CreateDirectory(uploadsFolder);

        // Generate unique filename
        var fileName = customFileName ?? $"{Guid.NewGuid()}{fileExtension}";
        var filePath = Path.Combine(uploadsFolder, fileName);

        // Save file
        using (var fileStream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(fileStream);
        }

        // Return relative path for database storage
        return Path.Combine(folder, fileName).Replace("\\", "/");
    }

    public async Task<bool> DeleteFileAsync(string filePath)
    {
        try
        {
            var fullPath = Path.Combine(_environment.WebRootPath, filePath);
            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
                return true;
            }
            return false;
        }
        catch
        {
            return false;
        }
    }

    public async Task<byte[]> GetFileAsync(string filePath)
    {
        var fullPath = Path.Combine(_environment.WebRootPath, filePath);
        if (File.Exists(fullPath))
        {
            return await File.ReadAllBytesAsync(fullPath);
        }
        throw new FileNotFoundException($"File not found: {filePath}");
    }

    public string GetFileUrl(string filePath)
    {
        var baseUrl = _configuration["AppSettings:BaseUrl"] ?? "https://localhost:5001";
        return $"{baseUrl}/{filePath}";
    }

    public bool FileExists(string filePath)
    {
        var fullPath = Path.Combine(_environment.WebRootPath, filePath);
        return File.Exists(fullPath);
    }
}
