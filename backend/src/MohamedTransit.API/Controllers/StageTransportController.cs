using Mapster;

using MediatR;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using MohamedTransit.Application;
using MohamedTransit.Application.Commands;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Entities;

using Transit.Application;

namespace MohamedTransit.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class StageTransportController : BaseController
{
    private readonly IMediator _mediator;
    private readonly string _licenceUploadPath;

    public StageTransportController(IMediator mediator)
    {
        _mediator = mediator;
        _licenceUploadPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "Licence_Document");

        if (!Directory.Exists(_licenceUploadPath))
        {
            Directory.CreateDirectory(_licenceUploadPath);
        }
    }

    [HttpPost("Create")]
    public async Task<IActionResult> Create([FromForm] CreateStageTransportRequest request)
    {
        if (request.LicenceDocumentImage == null || request.LicenceDocumentImage.Length == 0)
        {
            return BadRequest(new
            {
                Error = true,
                Message = "Licence file is required."
            });
        }

        // long timestamp (Ticks) በመጠቀም Unique የፋይል ስም ማዘጋጀት
        long uniqueTimestamp = DateTime.UtcNow.Ticks;
        var fileNameWithoutExt = Path.GetFileNameWithoutExtension(request.LicenceDocumentImage.FileName);
        var extension = Path.GetExtension(request.LicenceDocumentImage.FileName);

        var uniqueFileName = $"{fileNameWithoutExt}_{uniqueTimestamp}{extension}";
        var filePath = Path.Combine(_licenceUploadPath, uniqueFileName);

        using (var fileStream = new FileStream(filePath, FileMode.Create))
        {
            await request.LicenceDocumentImage.CopyToAsync(fileStream);
        }

        request.LicenceDocument = Path.Combine("Licence_Document", uniqueFileName).Replace("\\", "/");

        var command = request.Adapt<CreateStageTransportCommand>();
        var result = await _mediator.Send(command);

        if (result.IsError)
        {
            return HandleErrorResponse(result.Errors);
        }

        var response = result.Payload.Adapt<StageTransportResponse>();
        return HandleSuccessResponse(response);
    }

    [HttpPut("Update")]
    public async Task<IActionResult> Update([FromForm] UpdateStageTransportRequest clientRequest)
    {
        if (clientRequest.LicenceDocumentImage != null && clientRequest.LicenceDocumentImage.Length > 0)
        {
            // long timestamp (Ticks) በመጠቀም Unique የፋይል ስም ማዘጋጀት
            long uniqueTimestamp = DateTime.UtcNow.Ticks;
            var fileNameWithoutExt = Path.GetFileNameWithoutExtension(clientRequest.LicenceDocumentImage.FileName);
            var extension = Path.GetExtension(clientRequest.LicenceDocumentImage.FileName);

            var uniqueFileName = $"{fileNameWithoutExt}_{uniqueTimestamp}{extension}";
            var filePath = Path.Combine(_licenceUploadPath, uniqueFileName);

            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await clientRequest.LicenceDocumentImage.CopyToAsync(fileStream);
            }

            clientRequest.LicenceDocument = Path.Combine("Licence_Document", uniqueFileName).Replace("\\", "/");
        }

        var command = clientRequest.Adapt<UpdateStageTransportCommand>();
        var result = await _mediator.Send(command);

        if (result.IsError)
        {
            return HandleErrorResponse(result.Errors);
        }

        var response = result.Payload.Adapt<StageTransportResponse>();
        return HandleSuccessResponse(response);
    }

    [HttpGet("GetAllStageTransports")]
    public async Task<IActionResult> GetAllStageTransports([FromQuery] RecordStatus? recordStatus)
    {
        var query = new GetAllStageTransportQuery { RecordStatus = recordStatus };
        var result = await _mediator.Send(query);

        return result.IsError
            ? HandleErrorResponse(result.Errors)
            : HandleSuccessResponse(result.Payload.Adapt<List<StageTransportResponse>>());
    }

    [HttpGet("GetAllStageTransportsByServiceStageId")]
    public async Task<IActionResult> GetAllStageTransportsByServiceStageId([FromQuery] long serviceStageId)
    {
        var query = new GetAllStageTransportByServiceStageIdQuery { ServiceStageId = serviceStageId };
        var result = await _mediator.Send(query);

        return result.IsError
            ? HandleErrorResponse(result.Errors)
            : HandleSuccessResponse(result.Payload.Adapt<List<StageTransportResponse>>());
    }

    [HttpGet("GetStageTransportsById")]
    public async Task<IActionResult> GetStageTransportsById([FromQuery] long id)
    {
        var query = new GetStageTransportByIdQuery { Id = id };
        var result = await _mediator.Send(query);

        return result.IsError
            ? HandleErrorResponse(result.Errors)
            : HandleSuccessResponse(result.Payload.Adapt<StageTransportResponse>());
    }

    [HttpDelete("DeleteDocument")]
    public async Task<IActionResult> DeleteDocument([FromQuery] long id)
    {
        var command = new DeleteStageTransportQuery { Id = id };
        var result = await _mediator.Send(command);

        return result.IsError
            ? HandleErrorResponse(result.Errors)
            : HandleSuccessResponse(new { Message = "Stage Transport deleted successfully" });
    }
}
