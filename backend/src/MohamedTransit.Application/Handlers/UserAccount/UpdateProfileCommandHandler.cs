using MediatR;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Common;
using Microsoft.AspNetCore.Http;
using System.IO;

namespace MohamedTransit.Application.Features.Account.Commands
{
    public record UpdateProfileCommand(
        string UserId,
        string FirstName,
        string LastName,
        string Phone,
        string Username,
        string Email,
        IFormFile? ProfilePhotoFile // ፎቶውን እንደ ፋይል ለመቀበል የተጨመረው
    ) : IRequest<bool>;

    public class UpdateProfileCommandHandler : IRequestHandler<UpdateProfileCommand, bool>
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public UpdateProfileCommandHandler(
            ApplicationDbContext context,
            IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        public async Task<bool> Handle(UpdateProfileCommand request, CancellationToken cancellationToken)
        {
            if (!long.TryParse(request.UserId, out long parsedUserId))
            {
                throw new Exception("Invalid user ID format.");
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == parsedUserId, cancellationToken);

            if (user == null)
                throw new Exception("User not found.");

            // ነባሩን ፎቶ በነባሪነት መያዝ
            string profilePhotoPath = user.ProfilePhoto;

            // አዲስ ፎቶ ፋይል ከመጣ ሰርቨር ላይ ማስቀመጥ
            if (request.ProfilePhotoFile != null && request.ProfilePhotoFile.Length > 0)
            {
                var webRootPath = _environment.WebRootPath;
                if (string.IsNullOrWhiteSpace(webRootPath))
                {
                    webRootPath = Path.Combine(_environment.ContentRootPath, "wwwroot");
                }

                var uploadsFolder = Path.Combine(webRootPath, "uploads", "profiles");
                Directory.CreateDirectory(uploadsFolder);

                var extension = Path.GetExtension(Path.GetFileName(request.ProfilePhotoFile.FileName));
                var uniqueFileName = $"{Guid.NewGuid():N}{extension}";
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await request.ProfilePhotoFile.CopyToAsync(stream, cancellationToken);
                }

                profilePhotoPath = $"/uploads/profiles/{uniqueFileName}";
            }

            // የተጠቃሚውን መረጃ እና ፎቶ ማሻሻል
            user.UpdateUser(
                request.FirstName,
                request.LastName,
                profilePhotoPath, // አዲሱ ወይም ነባሩ የፎቶ ዱካ
                request.Phone,
                user.IsSuperAdmin,
                request.Username,
                request.Email,
                user.RecordStatus,
                user.AccountStatus
            );

            _context.Users.Update(user);
            await _context.SaveChangesAsync(cancellationToken);

            return true;
        }
    }
}
