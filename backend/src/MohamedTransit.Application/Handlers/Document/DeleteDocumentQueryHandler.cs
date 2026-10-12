using MediatR;

using Microsoft.EntityFrameworkCore; // FirstOrDefaultAsync እንዲሰራ ይህ ተጨምሯል

using MohamedTransit.Application.Helper;
using MohamedTransit.Application.Queries.Document;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;

namespace MohamedTransit.Application.Handlers.Document;

internal class DeleteDocumentQueryHandler
    : IRequestHandler<DeleteDocumentQuery, OperationResult<bool>>
{
    private readonly ApplicationDbContext _context;

    // Constructor name ከ Class name (DeleteDocumentQueryHandler) ጋር እንዲመሳሰል ተስተካክሏል
    public DeleteDocumentQueryHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OperationResult<bool>> Handle(DeleteDocumentQuery request, CancellationToken cancellationToken)
    {
        var result = new OperationResult<bool>();

        // Find the document
        var document = await _context.ServiceDocuments
            .FirstOrDefaultAsync(d => d.Id == request.DocumentId, cancellationToken);

        if (document == null)
        {
            result.AddError(ErrorCode.NotFound, "Document not found.");
            return result;
        }

        // Soft delete by updating recordStatus
        document.RecordStatus = RecordStatus.Delete; // ወይም Delete እንደ enum አጻጻፍሽ
        _context.ServiceDocuments.Update(document);
        await _context.SaveChangesAsync(cancellationToken);

        result.Payload = true;
        result.Message = "Document marked as deleted successfully";
        return result;
    }
}
