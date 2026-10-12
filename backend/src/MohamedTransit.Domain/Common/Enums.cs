namespace MohamedTransit.Domain.Common;
public enum HubLocation
{
    Djibouti = 1,
    Mojo = 2,
    Adama = 3
}
public enum OrderStatus
{
    Pending = 1, AcceptedByAgent = 2, AvailableToCRO = 3, AcceptedByCRO = 4
}
public enum Usage
{
    House = 1,
    Commercial = 2
}
public enum PropertyType
{
    Rent = 1, Sell = 2, Lease = 3
}
public enum PropertyStatus
{
    Available = 1,
    RentedOrSold = 2,
    LeasedOutside = 3
}
//public enum ShipmentStatus
//{
//    Registered = 1,
//    InTransitDjibouti = 2,
//    CustomsProcessing = 3,
//    Released = 4,
//    InTransitDestination = 5,
//    ArrivedAtHub = 6,
//    Delivered = 7,
//    Cancelled = 8
//}
public enum TransportMode
{
    MultiModalSeaRail = 1,
    UniModalRoad = 2
}
public enum RecordStatus
{
    InActive = 1,
    Active = 2,
    Delete = 3
}
public enum InspectionType
{
    Agreed = 1,
    Disagreed = 2
}
public enum NotificationType
{
    ServiceUpdate = 1,
    DocumentUpload = 2,
    StatusChange = 3,
    PaymentReminder = 4,
    SystemAlert = 5,
    Message = 6
}
public enum AccountStatus
{
    Pending = 1,
    Approved = 2,
    Rejected = 3,
    Locked = 4
}
public enum DocumentType
{
    Invoice = 1,
    BankReceipt = 2,
    DeliveryOrder = 3,
    InspectionReport = 4,
    ClearanceDocument = 5,
    TransportLicense = 6,
    ArrivalPhoto = 7,
    StoreReceipt = 8,
    LegalDocument = 9,
    Other = 10
}

public enum RiskLevel
{
    Blue = 1,
    Green = 2,
    Yellow = 3,
    Red = 4
}
public enum ProductAmount
{
    Container = 1,
    Ton = 2
}
public enum MessageType
{
    Group = 1,
    Direct = 2,
    System = 3
}

public enum ShipmentStatus
{
    Draft = 1,
    Submitted = 2,
    UnderReview = 3,
    Approved = 4,
    InProgress = 5,
    Completed = 6,
    Rejected = 7,
    Cancelled = 8,
     Deliverd=9
}
public enum StageSpot
{
    Released = 1,
    Notify = 2
}
public enum StageStatus
{
    NotStarted = 1,
    Pending = 2,
    InProgress = 3,
    Completed = 4,
    Blocked = 5,
    NeedsReview = 6
}
public enum ServiceType
{
    Multimodal = 1,
    Unimodal = 2
}
public enum RoleName
{
    SuperAdmin = 1,
    StoreAdmin = 2,
    Agent = 3,
    CRO = 4,
    Operator = 5,
    Customer = 6,
    // MOT System Roles
    Manager = 7,
    CaseExecutor = 8,
    Assessor = 9,
    DataEncoder = 10,
    Importer = 11
}

public enum PaymentStatus
{
    Pending = 1,
    Paid = 2,
    Failed = 3,
    Cancelled = 4,
    UnPaid = 5
}
public enum PaymentOption
{
    BankTransfer = 1,
    CBE = 2,
    TeleBirr = 3,
    Cash = 4
}
public enum ShipmentStage
{
    PrepaymentInvoice = 1,
    TransitPermission = 2,
    Amendment = 3,
    DropRisk = 4,
    DeliveryOrder = 5,
    WarehouseStatus = 6,
    Inspection = 7,
    AssessmentandTaxPayment = 8,
    Emergency = 9,
    ExitandStoragePayment = 10,
    Transportation = 11,
    LocalPermission = 12, // Unimodal only
    Arrival = 13, // Unimodal only
    Clearance = 14,
}
