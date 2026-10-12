using MediatR;

using MohamedTransit.Application.Commands.DataEncoder;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;
namespace MohamedTransit.Application.Handlers.DataEncoder
{
    
    public class CreateServiceCommandHandler : IRequestHandler<CreateServiceCommand, long>
    {
        private readonly ApplicationDbContext _context;

        public CreateServiceCommandHandler(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<long> Handle(CreateServiceCommand request, CancellationToken cancellationToken)
        {
            var service = new Domain.Entities.Service
            {
                Reference = request.Reference,
                ContactPerson = request.ContactPerson,
                Email = request.Email,
                Phone = request.Phone,
                Notes = request.Notes,
                ImporterId = request.ImporterId
            };

            _context.Services.Add(service);
            await _context.SaveChangesAsync(cancellationToken);

            // 2. ዳታቤዙ ካስቀመጠው በኋላ አውቶማቲክ የተፈጠረውን long Id ይመልሳል
            return service.Id;
        }
    }
}
