using MohamedTransit.Domain.Common;

namespace MohamedTransit.Domain.Entities;

public class RolePrivilege
{
    public long Id { get; set; }

    public long RoleId { get; set; }

    public long PrivilegeId { get; set; }

    public Privilege Privilege { get; set; } = null!;

    public Role Role { get; set; } = null!;
    public RecordStatus RecordStatus { get; set; } = RecordStatus.Active;
    public static RolePrivilege Create(long roleId, long privilegeId)
    {
        return new RolePrivilege
        {
            RoleId = roleId,
            PrivilegeId = privilegeId
        };
    }
}
