
using System.Data;
using MohamedTransit.Domain.Entities;
using MediatR;

using MohamedTransit.Application.Helper;

namespace MohamedTransit.Application.Commands.UserAccount;

public record CreateRoleCommand(string Name, string Description, List<long> Privileges) : IRequest<OperationResult<Role>>;

