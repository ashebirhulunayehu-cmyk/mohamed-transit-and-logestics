using MediatR;
using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Entities;
namespace MohamedTransit.Application;
public class CreateCustomerCommand : IRequest<OperationResult<User>>
{
    public string BusinessName { get; set; } = string.Empty;
    public string TINNumber { get; set; } = string.Empty;
    public string BusinessLicense { get; set; } = string.Empty;
    public string BusinessAddress { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string ContactPerson { get; set; } = string.Empty;
    public string ContactPhone { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;
    public string BusinessType { get; set; } = string.Empty;
    public string ImportLicense { get; set; } = string.Empty;
    public DateTime? ImportLicenseExpiry { get; set; }
    public long CreatedByDataEncoderId { get; set; }
    public long UserId { get; set; }
}
