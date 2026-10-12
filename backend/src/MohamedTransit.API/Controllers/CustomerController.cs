using Mapster;

using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MohamedTransit.API.DTO.MasterData.Request;
using MohamedTransit.API.DTO.MOT.Request;
using MohamedTransit.API.DTO.MOT.Response;
using MohamedTransit.API.Helpers;
using MohamedTransit.Application.Commands;
using MohamedTransit.Application.Commands.Shipment;
using MohamedTransit.Application.Queries.Customer;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;

using MohameTransit.API.DTO.MOT.Request;
namespace MohamedTransit.API.Controllers.MOT;
[ApiController]
[Route("api/v1/[controller]")]
public class CustomerController : BaseController
{
    private readonly ApplicationDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CustomerController(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
    }

    /// <summary>
    /// Create a new service request as a customer
    /// </summary>
    [HttpPost("CreateService")]
    public async Task<IActionResult> CreateService([FromBody] CreateCustomerServiceRequest request)
    {
        var currentUserId = JwtHelper.GetCurrentUserId(_httpContextAccessor, _context);
        if (currentUserId == null)
            return Unauthorized("User not authenticated");

        // Verify customer exists and is verified
        var customer = await _context.Customers
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.UserId == currentUserId.Value && c.IsVerified);

        if (customer == null)
            return BadRequest("Customer not found or not verified");

        var command = new CreateServiceCommand(
          customer.Id,
          currentUserId.Value,
          request.Description,
          (TransportMode)request.Mode, 
          request.Origin,
          request.Destination
      );
        var result = await _mediator.Send(command);

        // ErrorOr ስለሌለ በቀጥታ ውጤቱን እንመልሳለን
        return HandleSuccessResponse(result);
    }
    [HttpPost("Register")]
    public async Task<IActionResult> RegisterAsCustomer([FromBody] CreateCustomerRequest request)
    {
        // 1. አሁን ሎጊን ያደረገውን ዩዘር ID ከ Token እናገኛለን
        var currentUserId = JwtHelper.GetCurrentUserId(_httpContextAccessor, _context);
        if (currentUserId == null)
            return Unauthorized("User not authenticated");

        // 2. ይህ ዩዘር ቀደም ብሎ እንደ Customer ተመዝግቦ እንደሆነ እናረጋግጣለን
        var existingCustomer = await _context.Customers
            .FirstOrDefaultAsync(c => c.UserId == currentUserId.Value);

        if (existingCustomer != null)
            return BadRequest("You are already registered as a customer.");

        // 3. በ Customer ክላስ ውስጥ ባለው Customer.Create մեቶድ አማካኝነት አዲስ Customer እንፈጥራለን
        var customer = Customer.Create(
            businessName: request.BusinessName,
            tinNumber: request.TINNumber,
            businessLicense: request.BusinessLicense,
            businessAddress: request.BusinessAddress,
            city: request.City,
            state: request.State,
            postalCode: request.PostalCode,
            contactPerson: request.ContactPerson,
            contactPhone: request.ContactPhone,
            contactEmail: request.ContactEmail,
            businessType: request.BusinessType,
            importLicense: request.ImportLicense,
            importLicenseExpiry: request.ImportLicenseExpiry,
            userId: currentUserId.Value,
            createdByDataEncoderId: currentUserId.Value // ራሱ ዩዘሩ ስለመዘገበው (ወይም የተለየ DataEncoder ID ካለ መስጠት ይቻላል)
        );

        _context.Customers.Add(customer);
        await _context.SaveChangesAsync();

        return HandleSuccessResponse(customer, "Customer registered successfully. Waiting for admin approval.");
    }
    /// <summary>
    /// Get all services for the current customer
    /// </summary>
    [HttpGet("GetMyServices")]
    public async Task<IActionResult> GetMyServices([FromQuery] long UserId, RecordStatus? recordStatus)
    {
        var query = new GetMyServicesQuery { CustomerId = UserId, RecordStatus = recordStatus };
        var result = await _mediator.Send(query);
        var rolesList = result.Payload.Adapt<List<ShipmentDetail>>();
        return result.IsError ? HandleErrorResponse(result.Errors) : HandleSuccessResponse(rolesList);
    }

    /// <summary>
    /// Upload document for a service stage
    /// <summary>
    /// Upload document for a service stage
    /// </summary>
    [HttpPost("UploadStageDocument")]
    public async Task<IActionResult> UploadStageDocument(
        [FromForm] long serviceId,
        [FromForm] long stageId,
        [FromForm] IFormFile file,
        [FromForm] DocumentType documentType)
    {
        var currentUserId = JwtHelper.GetCurrentUserId(_httpContextAccessor, _context);
        if (currentUserId == null)
            return Unauthorized("User not authenticated");

       
        var service = await _context.Shipments
     .FirstOrDefaultAsync(s => s.Id == serviceId); 

        if (service == null)
            return NotFound("Service not found"); 

        var stage = await _context.ShipmentStages
            .FirstOrDefaultAsync(s => s.Id == stageId && s.ShipmentId == serviceId);

        if (stage == null)
            return NotFound("Service stage not found");

        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded");

        // Save file
        var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "service-documents");
        Directory.CreateDirectory(uploadsFolder);

        var uniqueFileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var fileStream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(fileStream);
        }

        // Create document record
        var document = StageDocument.Create(
            uniqueFileName,
            Path.Combine("service-documents", uniqueFileName),
            file.FileName,
            Path.GetExtension(file.FileName),
            file.Length,
            file.ContentType,
            documentType,
            stageId,
            currentUserId.Value
        );

        _context.StageDocuments.Add(document);
        await _context.SaveChangesAsync();

        return HandleSuccessResponse(document);
    }
    /// <summary>
    /// Get customer notifications
    /// </summary>
    [HttpGet("GetNotifications")]
    public async Task<IActionResult> GetNotifications([FromQuery] bool unreadOnly = false)
    {
        var currentUserId = JwtHelper.GetCurrentUserId(_httpContextAccessor, _context);
        if (currentUserId == null)
            return Unauthorized("User not authenticated");

        var query = _context.Notifications
            .Include(n => n.Shipment)
            .Where(n => n.UserId == currentUserId.Value);

        if (unreadOnly)
            query = query.Where(n => !n.IsRead);

        var notifications = await query
            .OrderByDescending(n => n.CreateAt)
            .ToListAsync();

        return HandleSuccessResponse(notifications);
    }

    /// <summary>
    /// Mark notification as read
    /// </summary>
    [HttpPut("MarkNotificationAsRead")]
    public async Task<IActionResult> MarkNotificationAsRead([FromQuery] long notificationId)
    {
        var currentUserId = JwtHelper.GetCurrentUserId(_httpContextAccessor, _context);
        if (currentUserId == null)
            return Unauthorized("User not authenticated");

        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == currentUserId.Value);

        if (notification == null)
            return NotFound("Notification not found");

        notification.MarkAsRead();
        await _context.SaveChangesAsync();

        return HandleSuccessResponse(notification);
    }

    /// <summary>
    /// Get customer profile information
    /// </summary>
    [HttpGet("GetProfile")]
    public async Task<IActionResult> GetProfile()
    {
        var currentUserId = JwtHelper.GetCurrentUserId(_httpContextAccessor, _context);
        if (currentUserId == null)
            return Unauthorized("User not authenticated");

        var customer = await _context.Customers
            .Include(c => c.User)
            .Include(c => c.Documents)
            .FirstOrDefaultAsync(c => c.UserId == currentUserId.Value);

        if (customer == null)
            return NotFound("Customer profile not found");

        return HandleSuccessResponse(customer);
    }
    /// <summary>
    /// Update service inspection type
    /// </summary>
    [HttpPut("UpdateInspectionType")] // ወይም [HttpGet] እንደ ጥያቄዎ ዓይነት
    public async Task<IActionResult> UpdateInspectionType([FromQuery] long id, [FromQuery] int InspectionTypes)
    {
        var currentUserId = JwtHelper.GetCurrentUserId(_httpContextAccessor, _context);
        if (currentUserId == null)
            return Unauthorized("User not authenticated");

        // 1. Shipment-ውን በ id እና በ customer (currentUserId) ይፈልጉ
        var service = await _context.Shipments
            .FirstOrDefaultAsync(s => s.Id == id && s.ImporterId == currentUserId.Value);

        if (service == null)
            return NotFound("Service or Shipment not found");

        // 2. የኢንስፔክሽን ዓይነቱን መቀየር (የእርስዎን ሜቶድ ወይም ፊልድ ስም ይጠቀሙ)
        // service.UpdateInspectionType((InspectionType)InspectionTypes); 
        // 👆 የኢንቲጀር ዋጋውን ወደሚፈለገው Enum ከቀየሩት በኋላ እዚህ ጋር ያዘምኑት

        await _context.SaveChangesAsync();

        return HandleSuccessResponse(service);
    }

    /// <summary>
    /// Update customer profile
    /// </summary>
    [HttpPut("UpdateProfile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateCustomerProfileRequest request)
    {
        var currentUserId = JwtHelper.GetCurrentUserId(_httpContextAccessor, _context);
        if (currentUserId == null)
            return Unauthorized("User not authenticated");

        var customer = await _context.Customers
            .FirstOrDefaultAsync(c => c.UserId == currentUserId.Value);

        if (customer == null)
            return NotFound("Customer profile not found");

        customer.UpdateBusinessInfo(
            request.BusinessName,
            request.BusinessAddress,
            request.City,
            request.State,
            request.PostalCode,
            request.ContactPerson,
            request.ContactPhone,
            request.ContactEmail
        );

        await _context.SaveChangesAsync();

        return HandleSuccessResponse(customer);
    }

    private async Task CreateServiceStages(long serviceId, ServiceType serviceType)
    {
        var stages = new List<ServiceStageExecution>();

        // Create stages based on service type
        switch (serviceType)
        {
            case ServiceType.Multimodal:
                stages.AddRange(new[]
                  {
                    ServiceStageExecution.Create(serviceId, ShipmentStage.PrepaymentInvoice),
                    ServiceStageExecution.Create(serviceId, ShipmentStage.TransitPermission),
                    ServiceStageExecution.Create(serviceId, ShipmentStage.Amendment),
                    ServiceStageExecution.Create(serviceId, ShipmentStage.DropRisk),
                    ServiceStageExecution.Create(serviceId, ShipmentStage.DeliveryOrder),
                    ServiceStageExecution.Create(serviceId, ShipmentStage.WarehouseStatus),
                    ServiceStageExecution.Create(serviceId, ShipmentStage.Inspection),
                    ServiceStageExecution.Create(serviceId, ShipmentStage.AssessmentandTaxPayment),
                    ServiceStageExecution.Create(serviceId, ShipmentStage.Emergency),
                    ServiceStageExecution.Create(serviceId, ShipmentStage.ExitandStoragePayment),
                    ServiceStageExecution.Create(serviceId, ShipmentStage.Transportation),
                    ServiceStageExecution.Create(serviceId, ShipmentStage.Clearance)
                });
                break;
            case ServiceType.Unimodal:
                stages.AddRange(new[]
                {
                    ServiceStageExecution.Create(serviceId, ShipmentStage.PrepaymentInvoice),
                    ServiceStageExecution.Create(serviceId, ShipmentStage.TransitPermission),
                    ServiceStageExecution.Create(serviceId, ShipmentStage.Amendment),
                    ServiceStageExecution.Create(serviceId, ShipmentStage.DropRisk),
                    ServiceStageExecution.Create(serviceId, ShipmentStage.DeliveryOrder),
                    ServiceStageExecution.Create(serviceId, ShipmentStage.WarehouseStatus),
                    ServiceStageExecution.Create(serviceId, ShipmentStage.Inspection),
                    ServiceStageExecution.Create(serviceId, ShipmentStage.AssessmentandTaxPayment),
                    ServiceStageExecution.Create(serviceId, ShipmentStage.Emergency),
                    ServiceStageExecution.Create(serviceId, ShipmentStage.ExitandStoragePayment),
                    ServiceStageExecution.Create(serviceId, ShipmentStage.Transportation),
                    ServiceStageExecution.Create(serviceId, ShipmentStage.LocalPermission),
                    ServiceStageExecution.Create(serviceId, ShipmentStage.Arrival),
                    ServiceStageExecution.Create(serviceId, ShipmentStage.Clearance)
                });
                break;
            default:
                stages.AddRange(new[]
                {
                    ServiceStageExecution.Create(serviceId, ShipmentStage.PrepaymentInvoice),
                    ServiceStageExecution.Create(serviceId, ShipmentStage.DropRisk),
                    ServiceStageExecution.Create(serviceId, ShipmentStage.DeliveryOrder)
                });
                break;
        }

        _context.ShipmentStages.AddRange(stages);
        await _context.SaveChangesAsync();
    }
}
