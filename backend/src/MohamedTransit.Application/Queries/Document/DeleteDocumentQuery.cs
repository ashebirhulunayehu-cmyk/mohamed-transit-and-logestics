using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using MediatR;

using MohamedTransit.Application.Helper;

using MohamedTransit.Domain.Entities;

namespace MohamedTransit.Application.Queries.Document;

public class DeleteDocumentQuery : IRequest<OperationResult<bool>>
{
    public long DocumentId { get; set; }
}
