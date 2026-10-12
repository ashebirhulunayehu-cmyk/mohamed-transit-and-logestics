namespace MohamedTransit.Application.DTO
{
    public class CreateServiceRequestDto
    {
        public long CustomerId { get; set; }
        public string ItemDescription { get; set; } = string.Empty;
        public string RouteCategory { get; set; } = string.Empty;
        public decimal DeclaredValue { get; set; }
        public string TaxCategory { get; set; } = string.Empty;
        public string CountryOfOrigin { get; set; } = string.Empty;
        public string ServiceType { get; set; } = string.Empty;
        public string? Notes { get; set; }
    }
}
