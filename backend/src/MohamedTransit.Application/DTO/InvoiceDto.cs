using MohamedTransit.Application.DTO;
using MohamedTransit.Domain.Common;

namespace MohamedTransit.Application.DTO   ;
public class InvoiceDto
{
    public string FilePath { get; set; }
    public string VendorName { get; set; }
    public string VendorAddress { get; set; }
    public string CustomerName { get; set; }
    public string CustomerId { get; set; }
    public string CustomerAddress { get; set; }
    public DateTime InvoiceDate { get; set; }
    public DateTime DueDate { get; set; }
    public double SubTotal { get; set; }
    public double Tax { get; set; }
    public double Total { get; set; }
    public string InvoiceNumber { get; set; }
    public string PurchaseOrderNumber { get; set; }
    public long PaymentId { get; set; }

    public List<OrderDto> Items = new List<OrderDto>();

}
public class OrderDto
{
    public long Id { get; set; }
    public string Name { get; set; }
    public string ReferenceNumber { get; set; }
    public string? Description { get; set; }
    public int PageCount { get; set; }
    public DateTime PaymentMadeDate { get; set; }
    public double Amount { get; set; }
    public PaymentStatus PaymentStatus { get; set; }
    public PaymentOption PaymentOption { get; set; }
    public long SubscriptionId { get; set; }
    public long OrganizationId { get; set; }
    public SubscriptionDetail Subscription { get; set; }
    public OrganizationDetailDto Organization { get; set; }

}

