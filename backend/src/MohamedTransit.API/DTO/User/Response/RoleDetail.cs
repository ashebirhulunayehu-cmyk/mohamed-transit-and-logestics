using MohamedTransit.Domain.Common;
namespace MohamedTransit.API.DTO.User.Response;

    public class RoleDetail
    {
        public long Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public RecordStatus RecordStatus { get; set; }
        //public string? RecordStatusDescription => RecordStatus.GetDisplayName();
        public List<PrivilegeDetail> Privileges { get; set; } = new();
    }


