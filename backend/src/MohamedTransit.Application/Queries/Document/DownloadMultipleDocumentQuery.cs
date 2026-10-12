using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using MediatR;

using MohamedTransit.Application.Helper;



namespace MohamedTransit.Application.Queries.Document;

public class DownloadMultipleDocumentsQuery : IRequest<OperationResult<byte[]>>
{
    public List<long> DocumentIds { get; set; } = new();
}
