using MediatR;

using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application.Documents.Commands;
using MohamedTransit.Application.Helper;
using MohamedTransit.Application.Service;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.Application.Handlers;

internal class UploadShipmentDocumentCommandHandler
    : IRequestHandler<UploadShipmentDocumentCommand, OperationResult<ServiceDocument>>
{
    private readonly ApplicationDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly TokenHandlerService _tokenHandlerService;

    public UploadShipmentDocumentCommandHandler(
        ApplicationDbContext context,
        IHttpContextAccessor httpContextAccessor,
        TokenHandlerService tokenHandlerService)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
        _tokenHandlerService = tokenHandlerService;
    }

    public async Task<OperationResult<ServiceDocument>> Handle(
        UploadShipmentDocumentCommand request,
        CancellationToken cancellationToken)
    {
        var result = new OperationResult<ServiceDocument>();

        try
        {
            var userId = await GetCurrentUserIdAsync(cancellationToken);
            if (userId == 0)
            {
                result.AddError(ErrorCode.NotFound, "User not authenticated.");
                return result;
            }

            // Service ፋንታ Shipment ተተክቷል
            var shipmentExists = await _context.Shipments
                .AnyAsync(s => s.Id == request.ShipmentId, cancellationToken);

            if (!shipmentExists)
            {
                result.AddError(ErrorCode.NotFound, "Shipment not found.");
                return result;
            }

            var uploadsFolder = Path.Combine("Uploads", "Shipments", DateTime.UtcNow.ToString("yyyyMMdd"));
            Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = $"{Guid.NewGuid()}{Path.GetExtension(request.File.FileName)}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            await using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await request.File.CopyToAsync(stream, cancellationToken);
            }

            // ServiceDocument Entity መፍጠር
            var document = ServiceDocument.Create(
                fileName: uniqueFileName,
                filePath: filePath,
                originalFileName: request.File.FileName,
                fileExtension: Path.GetExtension(request.File.FileName),
                fileSizeBytes: request.File.Length,
                mimeType: request.File.ContentType,
                documentType: request.DocumentType,
                serviceId: request.ShipmentId, // ShipmentId ይተላለፋል
                uploadedByUserId: userId,
                serviceStageId: request.ServiceStageId,
                description: request.Description
            );

            _context.ServiceDocuments.Add(document);
            await _context.SaveChangesAsync(cancellationToken);

            result.Payload = document;
            result.Message = "Shipment document uploaded successfully.";
        }
        catch (Exception ex)
        {
            result.AddError(ErrorCode.ServerError, ex.Message);
        }

        return result;
    }

    private async Task<long> GetCurrentUserIdAsync(CancellationToken cancellationToken)
    {
        var authorizationHeader = _httpContextAccessor.HttpContext?
            .Request.Headers["Authorization"].ToString();

        if (string.IsNullOrEmpty(authorizationHeader) || !authorizationHeader.StartsWith("Bearer "))
            return 0;

        var token = authorizationHeader["Bearer ".Length..].Trim();
        var claims = _tokenHandlerService.GetClaims(token);

        var userName = claims?.FirstOrDefault(c => c.Type == "userName")?.Value;
        if (string.IsNullOrEmpty(userName))
            return 0;

        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Username == userName, cancellationToken);

        return user?.Id ?? 0;
    }
}
