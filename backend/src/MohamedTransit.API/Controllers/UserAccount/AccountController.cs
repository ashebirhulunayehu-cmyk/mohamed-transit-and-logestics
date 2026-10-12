using System.Threading.Tasks;

using MediatR;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using MohamedTransit.Application.DTO;
using MohamedTransit.Application.Features.Account.Commands;
using MohamedTransit.Application.Handlers.UserAccount;

namespace MohamedTransit.API.Controllers
{
    [Authorize] // ሲስተሙ ውስጥ የገባ (Authenticated) ተጠቃሚ ብቻ እንዲጠቀምበት
    [Route("api/v1/[controller]")]
    [ApiController]
    public class AccountController : ControllerBase
    {
        private readonly IMediator _mediator;

        public AccountController(IMediator mediator)
        {
            _mediator = mediator;
        }

        // 1. የፕሮፋይል መረጃን ለማምጣት (GET)
        [HttpGet("GetProfile")]
        public async Task<ActionResult<UserProfileResponseDto>> GetProfile()
        {
            // ከ JWT Token ውስጥ "id" የሚለውን ክሌም እንወስዳለን
            var userId = User.FindFirst("id")?.Value;

            if (string.IsNullOrEmpty(userId))
                return Unauthorized("User ID not found in token.");

            var query = new GetProfileQuery(userId);
            var result = await _mediator.Send(query);

            return Ok(result);
        }

        // 2. የፕሮፋይል መረጃ እና ፎቶን ለማሻሻል (PUT - FromForm)
        [HttpPut("UpdateProfile")]
        public async Task<ActionResult<bool>> UpdateProfile([FromForm] UpdateProfileRequestDto request)
        {
            // ከ JWT Token ውስጥ "id" የሚለውን ክሌም እንወስዳለን
            var userId = User.FindFirst("id")?.Value;

            if (string.IsNullOrEmpty(userId))
                return Unauthorized("User ID not found in token.");

            var command = new UpdateProfileCommand(
                userId,
                request.FirstName,
                request.LastName,
                request.Phone,
                request.Username,
                request.Email,
                request.ProfilePhotoFile // የፎቶ ፋይሉን ወደ Command ማስተላለፍ
            );

            var result = await _mediator.Send(command);

            return Ok(new { success = result, message = "Profile and photo updated successfully." });
        }
    }

    // ለ PUT ጥያቄ የሚሆን የ Request DTO (ፋይልን ጨምሮ)
    public class UpdateProfileRequestDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public IFormFile? ProfilePhotoFile { get; set; } // የፕሮፋይል ፎቶ መቀበያ ፋይል
    }
}
