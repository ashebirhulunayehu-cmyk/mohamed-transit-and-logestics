using MediatR;
using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Entities;
namespace MohamedTransit.Application;
public class UpdateStageTransportCommand : IRequest<OperationResult<StageTransport>>
{
    public long Id { get; set; }
    public string FullName { get; set; }
    public string LicenceDocument { get; set; }
    public string PlateNumber { get; set; }
    public string PhoneNumber { get; set; }
    public long? ServiceStageId { get; set; }
    public ProductAmount ProductAmount { get; set; }
    public RecordStatus RecordStatus { get; set; }

}
