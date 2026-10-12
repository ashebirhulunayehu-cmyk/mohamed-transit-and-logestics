using MediatR;
using Microsoft.EntityFrameworkCore;
using MohamedTransit.Application.DTO;
using MohamedTransit.Domain.Data;
namespace MohamedTransit.Application.Handlers.UserAccount
{
    public record GetProfileQuery(string UserId) : IRequest<UserProfileResponseDto>;

    public class GetProfileQueryHandler : IRequestHandler<GetProfileQuery, UserProfileResponseDto>
    {
        private readonly ApplicationDbContext _context;

        public GetProfileQueryHandler(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<UserProfileResponseDto> Handle(GetProfileQuery request, CancellationToken cancellationToken)
        {
            if (!long.TryParse(request.UserId, out long parsedUserId))
            {
                throw new Exception("Invalid user ID format.");
            }

            // ተጠቃሚውን ከሮል እና ከሚመለከታቸው መረጃዎች ጋር ከዳታቤዝ መፈለግ
            var user = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role) // ሮል የሚለውን Table ከያዘ
                .FirstOrDefaultAsync(u => u.Id == parsedUserId, cancellationToken);

            if (user == null)
                throw new Exception("User not found.");

            // የተጠቃሚውን የመጀመሪያ ሮል ወይም ስም ማምጣት (ካለ)
            var userRole = user.UserRoles.FirstOrDefault()?.Role?.Name ?? "Standard User";

            return new UserProfileResponseDto
            {
                UserId = user.Id.ToString(),
                FullName = $"{user.FirstName} {user.LastName}".Trim(),
                Email = user.Email,
                Username = user.Username,
                Phone = user.Phone,
                Role = userRole, // ለየትኛውም ተጠቃሚ ትክክለኛውን ሮል ያስገባል
                ProfilePictureUrl = user.ProfilePhoto
            };
        }
    }
}
