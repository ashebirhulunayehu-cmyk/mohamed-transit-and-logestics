using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection.Metadata;
using System.Text;
using System.Threading.Tasks;

using MediatR;

using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Entities;
namespace MohamedTransit.Application.Queries.Document;
public class GetServiceDocumentsQuery : IRequest<OperationResult<List<ServiceDocument>>>
{
    public long ServiceId { get; set; }
    public RecordStatus? RecordStatus { get; set; }

}
