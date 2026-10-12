using MediatR;

namespace MohamedTransit.Application.Commands.DataEncoder;

public class CreateServiceCommand : IRequest<long>
{
    public string Reference { get; set; } = string.Empty;
    public string ContactPerson { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
    public long ImporterId { get; set; }
}
