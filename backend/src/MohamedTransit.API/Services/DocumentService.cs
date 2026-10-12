using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.API.Services;

public class DocumentService
{
    private readonly ApplicationDbContext _context;
    private readonly FileStorageService _fileStorageService;

    public DocumentService(ApplicationDbContext context, FileStorageService fileStorageService)
    {
        _context = context;
        _fileStorageService = fileStorageService;
    }

    public async Task<ServiceDocument> UploadDocumentAsync(
        IFormFile file,
        DocumentType documentType,
        long serviceId,
        long uploadedByUserId,
        long? serviceStageId = null,
        string? description = null,
        bool isRequired = false)
    {
        var filePath = await _fileStorageService.SaveFileAsync(file, "documents");
        var fileExtension = Path.GetExtension(file.FileName);

        var document = ServiceDocument.Create(
            fileName: Path.GetFileNameWithoutExtension(file.FileName),
            filePath: filePath,
            originalFileName: file.FileName,
            fileExtension: fileExtension,
            fileSizeBytes: file.Length,
            mimeType: file.ContentType,
            documentType: documentType,
            serviceId: serviceId,
            uploadedByUserId: uploadedByUserId,
            serviceStageId: serviceStageId,
            description: description,
            isRequired: isRequired
        );

        _context.Set<ServiceDocument>().Add(document);
        await _context.SaveChangesAsync();

        return document;
    }

    public async Task<bool> DeleteDocumentAsync(long documentId)
    {
        var document = await _context.Set<ServiceDocument>().FindAsync(documentId);
        if (document == null) return false;

        if (!string.IsNullOrEmpty(document.FilePath) && File.Exists(document.FilePath))
        {
            File.Delete(document.FilePath);
        }

        _context.Set<ServiceDocument>().Remove(document);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<ServiceDocument?> GetDocumentByIdAsync(long documentId)
    {
        return await _context.Set<ServiceDocument>()
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == documentId);
    }

    public async Task<IEnumerable<ServiceDocument>> GetDocumentsByServiceIdAsync(long serviceId)
    {
        return await _context.Set<ServiceDocument>()
            .AsNoTracking()
            .Where(d => d.ShipmentId == serviceId)
            .ToListAsync();
    }

    public async Task<bool> VerifyDocumentAsync(long documentId, bool isApproved, string? verificationNotes, long verifiedByUserId)
    {
        var document = await _context.Set<ServiceDocument>().FindAsync(documentId);
        if (document == null) return false;

        if (isApproved)
        {
            document.Verify(verifiedByUserId, verificationNotes);
        }
        else
        {
            document.VerifyDocument(false, verificationNotes);
        }

        await _context.SaveChangesAsync();
        return true;
    }
}
