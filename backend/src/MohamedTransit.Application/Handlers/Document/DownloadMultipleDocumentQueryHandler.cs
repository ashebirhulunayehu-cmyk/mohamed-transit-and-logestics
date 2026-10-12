using System.IO.Compression;

using MediatR;
using Microsoft.EntityFrameworkCore;
using MohamedTransit.Application.Helper;
using MohamedTransit.Application.Queries.Document;
using MohamedTransit.Domain.Data;
namespace MohamedTransit.Application.Handlers;

internal class DownloadMultipleDocumentsQueryHandler
    : IRequestHandler<DownloadMultipleDocumentsQuery, OperationResult<byte[]>>
{
    private readonly ApplicationDbContext _context;

    public DownloadMultipleDocumentsQueryHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OperationResult<byte[]>> Handle(
        DownloadMultipleDocumentsQuery request,
        CancellationToken cancellationToken)
    {
        var result = new OperationResult<byte[]>();

        var documents = await _context.ServiceDocuments
            .AsNoTracking()
            .Where(d => request.DocumentIds.Contains(d.Id))
            .ToListAsync(cancellationToken);

        if (!documents.Any())
        {
            result.AddError(ErrorCode.NotFound, "No documents found");
            return result;
        }

        using var ms = new MemoryStream();
        using (var zip = new ZipArchive(ms, ZipArchiveMode.Create, true))
        {
            foreach (var doc in documents)
            {
                if (!File.Exists(doc.FilePath)) continue;

                var entry = zip.CreateEntry(doc.FileName);
                using var entryStream = entry.Open();
                var fileBytes = await File.ReadAllBytesAsync(doc.FilePath, cancellationToken);
                await entryStream.WriteAsync(fileBytes, cancellationToken);
            }
        }

        ms.Position = 0; // rewind the stream

        result.Payload = ms.ToArray(); // return as byte array
        result.Message = "Documents zipped successfully";

        return result;
    }
}
