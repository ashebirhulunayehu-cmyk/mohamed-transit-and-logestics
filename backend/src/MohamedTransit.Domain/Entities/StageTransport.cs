using MohamedTransit.Domain.Common;

namespace MohamedTransit.Domain.Entities;

public class StageTransport : BaseEntity
{
    public string FullName { get; private set; } = string.Empty;
    public string LicenceDocument { get; private set; } = string.Empty;
    public string PlateNumber { get; private set; } = string.Empty;
    public string PhoneNumber { get; private set; } = string.Empty;
    public ProductAmount ProductAmount { get; private set; }
    public long? ServiceStageId { get; private set; }
    public ShipmentStage? ShipmentStage { get; private set; }

    private StageTransport() { } // For EF Core

    public static StageTransport Create(
        string fullName,
        string licenceDocument,
        string plateNumber,
        string phoneNumber,
        ProductAmount productAmount,
        long? serviceStageId)
    {
        return new StageTransport
        {
            FullName = fullName,
            LicenceDocument = licenceDocument,
            PlateNumber = plateNumber,
            PhoneNumber = phoneNumber,
            ProductAmount = productAmount,
            ServiceStageId = serviceStageId,
            RecordStatus = RecordStatus.Active
        };
    }

    public void UpdateTransport(
        string fullName,
        string licenceDocument,
        string plateNumber,
        string phoneNumber,
        ProductAmount productAmount,
        long? serviceStageId,
        RecordStatus recordStatus)
    {
        FullName = fullName;
        LicenceDocument = licenceDocument;
        PlateNumber = plateNumber;
        PhoneNumber = phoneNumber;
        ProductAmount = productAmount;
        ServiceStageId = serviceStageId;
        RecordStatus = recordStatus;

        SetUpdated();
    }
}
