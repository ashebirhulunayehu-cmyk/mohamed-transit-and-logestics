using System.ComponentModel.DataAnnotations;

using MohamedTransit.Domain.Common;
namespace MohamedTransit.API.DTO.User.Request;

    public class RoleRequest
    {
        public long Id { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;
        [Required]
        public string Description { get; set; } = string.Empty;

        public RecordStatus? RecordStatus { get; set; }

        [Required]
        public List<long> Privileges { get; set; }
        public RoleRequest()
        {
            Privileges = new List<long>();
        }

    }

    public class UpdaRoleRequest
    {
        [Required]

        public string RoleId { get; set; }
        public List<long> Privileges { get; set; }
        public UpdaRoleRequest()
        {
            Privileges = new List<long>();
        }
    }

    public class UpdateRoleStatusDto
    {
        public RecordStatus RecordStatus { get; set; }
        public long Id { get; set; }
    }

