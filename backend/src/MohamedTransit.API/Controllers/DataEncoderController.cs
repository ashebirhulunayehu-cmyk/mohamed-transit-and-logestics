using Mapster;

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using MohamedTransit.API.DTO.MOT.Request;
using MohamedTransit.Application.Commands.DataEncoder;
using MohamedTransit.API.DTO.MOT.Response;
using MohamedTransit.API.Helpers;
using MohamedTransit.API.Services;
using MohamedTransit.Application.Commands.Shipment;
using MohamedTransit.Application.DTO;
using MohamedTransit.Application.Queries;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;


namespace MohamedTransit.API.Controllers.MOT;

[ApiController]
[Route("api/v1/[controller]")]
public class DataEncoderController : BaseController
{
    private readonly ApplicationDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IFileStorageService _fileStorageService;

    public DataEncoderController(
        ApplicationDbContext context,
        IHttpContextAccessor httpContextAccessor,
        IFileStorageService fileStorageService)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
        _fileStorageService = fileStorageService;
    }

    /// <summary>
    /// Create a new customer
    /// </summary>
    [HttpPost("CreateCustomer")]
    public async Task<IActionResult> CreateCustomer([FromBody] MohamedTransit.API.DTO.MasterData.Request.CreateCustomerRequest request)
    {
        var currentUserId = JwtHelper.GetCurrentUserId(_httpContextAccessor, _context);
        if (currentUserId == null)
            return Unauthorized("User not authenticated");
        // Check if user already exists
        var existingUser = await _context.Customers
            .FirstOrDefaultAsync(u => u.Id == request.UserId);

        if (existingUser != null)
            return BadRequest("User with this email or username already exists");

        // Create customer profile
        var customer = Customer.Create(
            request.BusinessName,
            request.TINNumber,
            request.BusinessLicense,
            request.BusinessAddress,
            request.City,
            request.State,
            request.PostalCode,
            request.ContactPerson,
            request.ContactPhone,
            request.ContactEmail,
            request.BusinessType,
            request.ImportLicense,
            request.ImportLicenseExpiry,
            request.UserId,
            currentUserId.Value
        );

        _context.Customers.Add(customer);
        await _context.SaveChangesAsync();

        return HandleSuccessResponse(customer);
    }

    /// <summary>
    /// Get all customers created by the data encoder
    /// </summary>
    [HttpGet("GetAllCustomers/{recordStatus}")]
    public async Task<IActionResult> GetAllCustomers(
        RecordStatus? recordStatus,
        CancellationToken cancellationToken)
    {
        var query = new GetAllCustomersQuery { RecordStatus = recordStatus };
        var result = await _mediator.Send(query, cancellationToken);
        if (result.IsError)
            return HandleErrorResponse(result.Errors);

        var customers = result.Payload ?? [];
        var customerUserIds = customers
            .Where(customer => customer.UserId.HasValue)
            .Select(customer => customer.UserId!.Value)
            .Distinct()
            .ToArray();
        var activeStatuses = new[]
        {
            ShipmentStatus.Submitted,
            ShipmentStatus.UnderReview,
            ShipmentStatus.Approved,
            ShipmentStatus.InProgress
        };
        var activeCasesByImporter = await _context.Shipments
            .Where(shipment =>
                customerUserIds.Contains(shipment.ImporterId) &&
                activeStatuses.Contains(shipment.Status))
            .GroupBy(shipment => shipment.ImporterId)
            .Select(group => new { ImporterId = group.Key, Count = group.Count() })
            .ToDictionaryAsync(item => item.ImporterId, item => item.Count, cancellationToken);

        var rolesList = customers.Adapt<List<CustomerDetail>>();
        for (var index = 0; index < customers.Count; index++)
        {
            var customer = customers[index];
            rolesList[index].RegisteredAt = customer.CreateAt;
            rolesList[index].ActiveCases =
                customer.UserId.HasValue && activeCasesByImporter.TryGetValue(customer.UserId.Value, out var count)
                    ? count
                    : 0;
        }

        return HandleSuccessResponse(rolesList);

    }
    /// <summary>
    /// Update customer information before approval
    /// </summary>
    [HttpPut("UpdateCustomer")]
    public async Task<IActionResult> UpdateCustomer([FromBody] MohamedTransit.API.DTO.MOT.Request.UpdateCustomerRequest request)
    {
        var customer = await _context.Customers
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.Id == request.Id);

        if (customer == null)
            return NotFound("Customer not found or not created by you");


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
    // POST: api/v1/DataEncoder/services
    [HttpPost("Create services")]
    public async Task<IActionResult> CreateService([FromBody] CreateServiceRequestDto request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var currentUserId = JwtHelper.GetCurrentUserId(_httpContextAccessor, _context);
        if (currentUserId == null)
            return Unauthorized("User not authenticated");

        if (!await IsDataEncoder(currentUserId.Value))
            return Forbid();

        if (request.CustomerId <= 0 ||
            string.IsNullOrWhiteSpace(request.ItemDescription) ||
            string.IsNullOrWhiteSpace(request.RouteCategory) ||
            request.DeclaredValue < 0 ||
            string.IsNullOrWhiteSpace(request.TaxCategory) ||
            string.IsNullOrWhiteSpace(request.CountryOfOrigin) ||
            string.IsNullOrWhiteSpace(request.ServiceType))
        {
            return BadRequest("Customer, shipment details, and a non-negative declared value are required.");
        }

        var serviceType = request.ServiceType.Trim().ToLowerInvariant() switch
        {
            "multimodal" => ServiceType.Multimodal,
            "unimodal" => ServiceType.Unimodal,
            _ => (ServiceType?)null
        };
        if (serviceType == null)
            return BadRequest("Service type must be Multimodal or Unimodal.");

        var customer = await _context.Customers
            .AsNoTracking()
            .FirstOrDefaultAsync(
                customer => customer.Id == request.CustomerId &&
                            customer.CreatedByDataEncoderId == currentUserId.Value,
                cancellationToken);
        if (customer == null)
            return NotFound("Customer not found for this data encoder.");
        if (customer.UserId == null)
            return BadRequest("The selected customer is not linked to an importer account.");

        var service = Shipment.Create(
            $"MT-{Guid.NewGuid():N}",
            request.ItemDescription.Trim(),
            customer.UserId.Value,
            request.ItemDescription.Trim(),
            serviceType == ServiceType.Multimodal
                ? TransportMode.MultiModalSeaRail
                : TransportMode.UniModalRoad,
            serviceType == ServiceType.Multimodal ? HubLocation.Mojo : HubLocation.Adama,
            request.CountryOfOrigin.Trim(),
            request.RouteCategory.Trim(),
            currentUserId.Value);
        service.UpdateServiceType(serviceType.Value);
        service.UpdateStatus(ShipmentStatus.Draft);
        service.UpdateDetails(
            request.ItemDescription.Trim(),
            request.RouteCategory.Trim(),
            request.DeclaredValue,
            request.TaxCategory.Trim(),
            request.CountryOfOrigin.Trim(),
            null);
        service.SetCreatedByDataEncoder(currentUserId.Value);
        service.AssignmentNotes = request.Notes?.Trim();

        _context.Shipments.Add(service);
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(new
        {
            success = true,
            message = "Service draft created successfully.",
            data = new
            {
                id = service.Id,
                trackingNumber = service.TrackingNumber,
                status = service.Status.ToString()
            }
        });
    }
    [HttpPut("services/{id}/service-type")]
    public async Task<IActionResult> UpdateServiceType(
        long id,
        [FromBody] UpdateServiceTypeRequest request,
        CancellationToken cancellationToken)
    {
        var currentUserId = JwtHelper.GetCurrentUserId(_httpContextAccessor, _context);
        if (currentUserId == null)
            return Unauthorized("User not authenticated");
        if (!await IsDataEncoder(currentUserId.Value))
            return Forbid();

        var service = await _context.Shipments.FirstOrDefaultAsync(
            shipment => shipment.Id == id &&
                        shipment.CreatedByDataEncoderId == currentUserId.Value,
            cancellationToken);
        if (service == null)
            return NotFound("Service not found");
        if (service.Status != ShipmentStatus.Draft)
            return Conflict("Service details can only be updated before submission.");
        if (!Enum.IsDefined(typeof(ServiceType), request.ServiceType))
            return BadRequest("A valid service type is required.");

        service.UpdateServiceType(request.ServiceType);
        await _context.SaveChangesAsync(cancellationToken);

        return HandleSuccessResponse(new { Success = true, Message = "Service type updated successfully." });
    }
    [HttpPost("services/{id}/documents")]
    public async Task<IActionResult> UploadServiceDocuments(
        long id,
        [FromForm] List<IFormFile> files,
        CancellationToken cancellationToken)
    {
        var currentUserId = JwtHelper.GetCurrentUserId(_httpContextAccessor, _context);
        if (currentUserId == null)
            return Unauthorized("User not authenticated");
        if (!await IsDataEncoder(currentUserId.Value))
            return Forbid();

        var service = await _context.Shipments
            .FirstOrDefaultAsync(
                shipment => shipment.Id == id &&
                            shipment.CreatedByDataEncoderId == currentUserId.Value,
                cancellationToken);

        if (service == null)
            return NotFound("Service not found");
        if (service.Status != ShipmentStatus.Draft)
            return Conflict("Documents can only be added before service submission.");

        if (files == null || files.Count == 0)
            return BadRequest("No files uploaded.");

        var allowedExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            ".pdf", ".jpg", ".jpeg", ".png", ".xlsx"
        };
        foreach (var file in files)
        {
            var extension = Path.GetExtension(file.FileName);
            if (file.Length <= 0 ||
                file.Length > 25 * 1024 * 1024 ||
                !allowedExtensions.Contains(extension))
                return BadRequest("Each document must be a PDF, JPG, PNG, or XLSX file no larger than 25 MB.");
        }

        foreach (var file in files)
        {
            var filePath = await _fileStorageService.SaveFileAsync(file, "uploads/documents");
            var document = ServiceDocument.Create(
                Path.GetFileName(filePath),
                filePath,
                Path.GetFileName(file.FileName),
                Path.GetExtension(file.FileName),
                file.Length,
                file.ContentType,
                DocumentType.Other,
                id,
                currentUserId.Value,
                description: "Supporting document");
            _context.ServiceDocuments.Add(document);
        }
        await _context.SaveChangesAsync(cancellationToken);

        return HandleSuccessResponse(new { Success = true, Message = "Documents uploaded successfully." });
    }
    [HttpPost("services/{id}/submit")]
    public async Task<IActionResult> SubmitService(long id, CancellationToken cancellationToken)
    {
        var currentUserId = JwtHelper.GetCurrentUserId(_httpContextAccessor, _context);
        if (currentUserId == null)
            return Unauthorized("User not authenticated");
        if (!await IsDataEncoder(currentUserId.Value))
            return Forbid();

        var service = await _context.Shipments.FirstOrDefaultAsync(
            shipment => shipment.Id == id &&
                        shipment.CreatedByDataEncoderId == currentUserId.Value,
            cancellationToken);
        if (service == null)
            return NotFound("Service not found");

        if (service.Status != ShipmentStatus.Submitted)
            service.Submit();

        await _context.SaveChangesAsync(cancellationToken);

        return HandleSuccessResponse(new { Success = true, Message = "Service submitted successfully and locked for approval." });
    }

    // GET: api/v1/DataEncoder/services
    [HttpGet("services")]
    public async Task<ActionResult<IEnumerable<ShipmentDetail>>> GetAllServices(CancellationToken cancellationToken)
    {
        var currentUserId = JwtHelper.GetCurrentUserId(_httpContextAccessor, _context);
        if (currentUserId == null)
            return Unauthorized("User not authenticated");

        var services = await _context.Shipments
            .AsNoTracking()
            .Where(service => service.CreatedByDataEncoderId == currentUserId.Value)
            .OrderByDescending(service => service.CreateAt)
            .Select(service => new ShipmentDetail
            {
                Id = service.Id,
                ServiceNumber = service.TrackingNumber,
                ItemDescription = service.Description,
                RouteCategory = service.RouteCategory,
                DeclaredValue = service.DeclaredValue,
                TaxCategory = service.TaxCategory,
                CountryOfOrigin = service.CountryOfOrigin,
                Origin = service.Origin,
                Destination = service.Destination,
                ServiceType = service.ServiceType ?? ServiceType.Multimodal,
                Status = service.Status,
                RiskLevel = service.RiskLevel,
                CustomerId = service.ImporterId,
                ImporterName = _context.Customers
                    .Where(customer => customer.UserId == service.ImporterId)
                    .Select(customer => customer.BusinessName)
                    .FirstOrDefault() ?? string.Empty,
                ImporterTinNumber = _context.Customers
                    .Where(customer => customer.UserId == service.ImporterId)
                    .Select(customer => customer.TINNumber)
                    .FirstOrDefault() ?? string.Empty,
                AssignedCaseExecutorId = service.AssignedCaseExecutorId,
                AssignedAssessorId = service.AssignedAssessorId,
                RegisteredDate = service.CreateAt,
                DueAt = service.Status == ShipmentStatus.Submitted || service.Status == ShipmentStatus.UnderReview
                    ? service.CreateAt.AddHours(48)
                    : null,
                LastUpdateDate = service.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        return Ok(services);
    }
    /// <summary>
    /// Get all documents across all services for the Document Centre
    /// </summary>
    /// <summary>
    /// Get all documents across all services for the Document Centre
    /// </summary>
    /// <summary>
    /// Get all documents across all services for the Document Centre
    /// <summary>
    /// Get all documents across all services for the Document Centre
    /// </summary>
    /// <summary>
    /// Get all documents across all services for the Document Centre
    /// </summary>
    /// <summary>
    /// Get all documents across all services for the Document Centre
    /// </summary>
    [HttpGet("documents")]
    public async Task<IActionResult> GetAllDocuments(CancellationToken cancellationToken)
    {
        var documents = await _context.ServiceDocuments
            .Include(d => d.Shipment)
            .OrderByDescending(d => d.CreateAt)
            .ToListAsync(cancellationToken);

        var documentDtos = documents.Select(d => new
        {
            id = d.Id,
            documentName = d.FileName,
            documentType = d.DocumentType.ToString(),
            // Reference ፋንታ የ Shipmentን Id መጠቀም (ወይም በሞዴልዎ ያለውን ትክክለኛ ስም ማስገባት)
            serviceReference = d.Shipment != null ? d.Shipment.Id.ToString() : "SVC-0000",
            stage = "N/A", // ሞዴሉ ላይ StageName ከሌለ በጊዜያዊነት
            uploadedBy = "System", // ሞዴሉ ላይ UploadedByName ከሌለ
            uploadedDate = d.CreateAt.ToString("dd MMM yyyy, HH:mm"),
            status = "Active" // Status ከሌለ
        });

        return Ok(new { Success = true, Data = documentDtos });
    }
    /// <summary>
    /// Get data encoder dashboard
    /// </summary>
    [HttpGet("GetDashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var currentUserId = JwtHelper.GetCurrentUserId(_httpContextAccessor, _context);
        if (currentUserId == null)
            return Unauthorized("User not authenticated");

        var now = DateTime.UtcNow;
        var serviceReviewStatuses = new[] { ShipmentStatus.Submitted, ShipmentStatus.UnderReview };

        var dashboard = new MohamedTransit.API.DTO.MOT.Response.DataEncoderDashboardResponse
        {
            TotalCustomersCreated = await _context.Customers.CountAsync(c => c.CreatedByDataEncoderId == currentUserId.Value),
            PendingCustomerApprovals = await _context.Customers.CountAsync(c => c.CreatedByDataEncoderId == currentUserId.Value && !c.IsVerified),
            TotalServicesCreated = await _context.Shipments.CountAsync(s => s.CreatedByDataEncoderId == currentUserId.Value),
            PendingServiceApprovals = await _context.Shipments.CountAsync(s => s.CreatedByDataEncoderId == currentUserId.Value && s.Status == ShipmentStatus.Submitted),
            DraftServices = await _context.Shipments.CountAsync(s => s.CreatedByDataEncoderId == currentUserId.Value && s.Status == ShipmentStatus.Draft),
            DueWithin48Hours = await _context.Shipments.CountAsync(s =>
                s.CreatedByDataEncoderId == currentUserId.Value &&
                serviceReviewStatuses.Contains(s.Status) &&
                s.CreateAt > now.AddHours(-48) &&
                s.CreateAt <= now)
        };

        // Get recent activities
        var recentCustomersList = await _context.Customers
            .Include(c => c.User)
            .Where(c => c.CreatedByDataEncoderId == currentUserId.Value)
            .OrderByDescending(c => c.CreateAt)
            .Take(5)
            .ToListAsync();

        dashboard.RecentCustomers = recentCustomersList.Adapt<List<Customer>>();
        
    // DTO mapping

        dashboard.RecentServices = await _context.Shipments
            .AsNoTracking()
            .Where(s => s.CreatedByDataEncoderId == currentUserId.Value)
            .OrderByDescending(s => s.CreateAt)
            .Take(5)
            .Select(service => new ShipmentDetail
            {
                Id = service.Id,
                ServiceNumber = service.TrackingNumber,
                ItemDescription = service.Description,
                RouteCategory = service.RouteCategory,
                DeclaredValue = service.DeclaredValue,
                TaxCategory = service.TaxCategory,
                CountryOfOrigin = service.CountryOfOrigin,
                Origin = service.Origin,
                Destination = service.Destination,
                ServiceType = service.ServiceType ?? ServiceType.Multimodal,
                Status = service.Status,
                RiskLevel = service.RiskLevel,
                CustomerId = service.ImporterId,
                ImporterName = _context.Customers
                    .Where(customer => customer.UserId == service.ImporterId)
                    .Select(customer => customer.BusinessName)
                    .FirstOrDefault() ?? string.Empty,
                ImporterTinNumber = _context.Customers
                    .Where(customer => customer.UserId == service.ImporterId)
                    .Select(customer => customer.TINNumber)
                    .FirstOrDefault() ?? string.Empty,
                AssignedCaseExecutorId = service.AssignedCaseExecutorId,
                AssignedAssessorId = service.AssignedAssessorId,
                RegisteredDate = service.CreateAt,
                DueAt = service.Status == ShipmentStatus.Submitted || service.Status == ShipmentStatus.UnderReview
                    ? service.CreateAt.AddHours(48)
                    : null,
                LastUpdateDate = service.UpdatedAt
            })
            .ToListAsync();

        return HandleSuccessResponse(dashboard);
    }

    private async Task CreateServiceStages(long serviceId, ServiceType serviceType)
    {
        var stages = new List<ShipmentStage>
        {
            ShipmentStage.PrepaymentInvoice,
            ShipmentStage.DropRisk,
            ShipmentStage.DeliveryOrder,
            ShipmentStage.Inspection,
            ShipmentStage.Emergency,
            ShipmentStage.Clearance,
            ShipmentStage.Transportation,
            ShipmentStage.AssessmentandTaxPayment,
            ShipmentStage.WarehouseStatus,
            ShipmentStage.TransitPermission,
            ShipmentStage.Amendment,
            ShipmentStage.ExitandStoragePayment,



        };
        // Add unimodal-specific stages
        if (serviceType == ServiceType.Unimodal)
        {
            stages.Add(ShipmentStage.LocalPermission);
            stages.Add(ShipmentStage.Arrival);
        }

        foreach (var stage in stages)
        {
            var serviceStage = ServiceStageExecution.Create(serviceId, stage);
            _context.ShipmentStages.Add(serviceStage);
        }

        await _context.SaveChangesAsync();
    }

    private long? GetCurrentUserId()
    {
        var authorizationHeader = _httpContextAccessor.HttpContext?.Request.Headers["Authorization"].ToString();
        if (string.IsNullOrEmpty(authorizationHeader) || !authorizationHeader.StartsWith("Bearer "))
            return null;

        return 1; // This should be extracted from the JWT token
    }

    private async Task<bool> IsDataEncoder(long userId)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == userId);

        return user?.UserRoles.Any(ur => ur.Role.Name == "DataEncoder") ?? false;
    }
}
