using MediatR;

using MohamedTransit.Domain.Entities;
using MohamedTransit.Application.Helper;
using MohamedTransit.Domain;

namespace MohamedTransit.Application.Commands.UserAccount;

public record CreatePrivilegeCommand(
    string Action,
    string Description
) : IRequest<OperationResult<Privilege>>;
