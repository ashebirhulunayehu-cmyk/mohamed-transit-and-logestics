using MediatR;

using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application.Helper;
using MohamedTransit.Application.Queries.Document;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;


namespace MohamedTransit.Application.Handlers;

internal class DownloadDocumentQueryHandler
    : IRequestHandler<DownloadDocumentQuery, OperationResult<ServiceDocument>>
{
    private readonly ApplicationDbContext _context;

    public DownloadDocumentQueryHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OperationResult<ServiceDocument>> Handle(
        DownloadDocumentQuery request,
        CancellationToken cancellationToken)
    {
        var result = new OperationResult<ServiceDocument>();

        // Fetch document from DB
        var document = await _context.ServiceDocuments
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == request.DocumentId, cancellationToken);

        if (document == null)
        {
            result.AddError(ErrorCode.NotFound, "Document not found in database");
            return result;
        }

        // Verify file exists on disk
        if (string.IsNullOrEmpty(document.FilePath) || !File.Exists(document.FilePath))
        {
            result.AddError(ErrorCode.NotFound, "File not found on server");
            return result;
        }

        result.Payload = document;
        result.Message = "Document ready for download";

        return result;
    }
}
