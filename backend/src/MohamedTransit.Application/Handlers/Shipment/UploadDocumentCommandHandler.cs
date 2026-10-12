using MediatR;

using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application.Commands;
using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.Application.Handlers.DocumentHandler;

internal class UploadDocumentCommandHandler : IRequestHandler<UploadDocumentCommand, OperationResult<StageDocument>>
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;

    public UploadDocumentCommandHandler(ApplicationDbContext context, IWebHostEnvironment environment)
    {
        _context = context;
        _environment = environment;
    }

    public async Task<OperationResult<StageDocument>> Handle(UploadDocumentCommand request, CancellationToken cancellationToken)
    {
        var result = new OperationResult<StageDocument>();

        // 1. File መላኩን ማረጋገጥ
        if (request.File == null || request.File.Length == 0)
        {
            result.AddError(ErrorCode.ValidationError, "No file was uploaded or the file is empty.");
            return result;
        }

        // 2. ServiceStageExecution መኖሩን ማረጋገጥ
        var stageExecution = await _context.ServiceStageExecutions
            .FirstOrDefaultAsync(s => s.Id == request.StageId && s.ShipmentId == request.ShipmentId, cancellationToken);

        if (stageExecution == null)
        {
            result.AddError(ErrorCode.NotFound, $"Stage execution with ID '{request.StageId}' for Shipment '{request.ShipmentId}' was not found.");
            return result;
        }

        // 3. File ዝርዝሮች (Path, Extension, MimeType, Unique Name) ማዘጋጀት
        var originalFileName = Path.GetFileName(request.File.FileName);
        var fileExtension = Path.GetExtension(originalFileName);
        var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";

        var uploadsFolder = Path.Combine(_environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads", "documents");
        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        var fullFilePath = Path.Combine(uploadsFolder, uniqueFileName);

        // 4. ፋይሉን ማስቀመጥ
        using (var stream = new FileStream(fullFilePath, FileMode.Create))
        {
            await request.File.CopyToAsync(stream, cancellationToken);
        }

        var relativePath = Path.Combine("uploads", "documents", uniqueFileName).Replace("\\", "/");

        // 5. StageDocument.Create Factory Method በመጠቀም Entity መፍጠር
        // (ማስታወሻ፡ Current User ID ከ Context ካለሽ 'uploadedByUserId' ቦታ ላይ ተቀቀሚው)
        long currentUserId = 1; // TODO: Replace with actual CurrentUser/Session Service User ID

        var document = StageDocument.Create(
            fileName: uniqueFileName,
            filePath: request.FilePath ?? relativePath,
            originalFileName: originalFileName,
            fileExtension: fileExtension,
            fileSizeBytes: request.File.Length,
            mimeType: request.File.ContentType,
            documentType: request.DocumentType,
            serviceStageId: request.StageId,
            uploadedByUserId: currentUserId,
            description: request.Description?.Trim(),
            isRequired: false
        );

        // 6. ዳታቤዝ ውስጥ መመዝገብ
        await _context.StageDocuments.AddAsync(document, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        // 7. Result መመለስ
        result.Payload = document;
        result.Message = "Document uploaded and saved successfully.";

        return result;
    }
}
