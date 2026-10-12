using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

using MediatR;

using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application.Helper;
using MohamedTransit.Application.Queries.Customer.CaseExecuter;
using MohamedTransit.Domain.Data;

namespace MohamedTransit.Application.Handlers;

internal class DownloadMultipleStageDocumentsQueryHandler
    : IRequestHandler<DownloadMultipleStageDocumentsQuery, OperationResult<byte[]>>
{
    private readonly ApplicationDbContext _context;

    public DownloadMultipleStageDocumentsQueryHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OperationResult<byte[]>> Handle(
        DownloadMultipleStageDocumentsQuery request,
        CancellationToken cancellationToken)
    {
        var result = new OperationResult<byte[]>();

        try
        {
            if (request.DocumentIds == null || !request.DocumentIds.Any())
            {
                result.AddError(ErrorCode.NotFound, "No document IDs provided.");
                return result;
            }

            var documents = await _context.StageDocuments
                .AsNoTracking()
                .Where(d => request.DocumentIds.Contains(d.Id))
                .ToListAsync(cancellationToken);

            if (!documents.Any())
            {
                result.AddError(ErrorCode.NotFound, "No documents found in database.");
                return result;
            }

            using var ms = new MemoryStream();
            int addedFilesCount = 0;

            // ZipArchive scope ውስጥ በመክተት መጨረሻ ላይ ራሱ Flush/Dispose ማድረጉን ማረጋገጥ
            using (var zip = new ZipArchive(ms, ZipArchiveMode.Create, true))
            {
                foreach (var doc in documents)
                {
                    if (string.IsNullOrEmpty(doc.FilePath) || !File.Exists(doc.FilePath))
                        continue;

                    var entry = zip.CreateEntry(doc.FileName ?? Path.GetFileName(doc.FilePath));
                    using var entryStream = entry.Open();
                    using var fileStream = File.OpenRead(doc.FilePath);

                    await fileStream.CopyToAsync(entryStream, cancellationToken);
                    addedFilesCount++;
                }
            } // እዚህ ጋር ZipArchive ይዘጋል፤ ዳታው ወደ MemoryStream ተጽፎ ያበቃል።

            if (addedFilesCount == 0)
            {
                result.AddError(ErrorCode.NotFound, "Physical files were not found on the server.");
                return result;
            }

            result.Payload = ms.ToArray();
            return result;
        }
        catch (Exception ex)
        {
            result.AddError(ErrorCode.ServerError, ex.Message);
            return result;
        }
    }
}
