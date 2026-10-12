using MohamedTransit.Domain.Common;

namespace MohamedTransit.Domain.Entities;

public class Role
{
    private List<RolePrivilege> _rolePrivileges = new();

    public long Id { get; set; }

    public string Name { get; private set; } = string.Empty;

    public string Description { get; private set; } = string.Empty;

    public RecordStatus RecordStatus { get; set; } = RecordStatus.Active;

    public ICollection<RolePrivilege> RolePrivileges
    {
        get { return _rolePrivileges; }
    }

    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();

    public static Role Create(string name, string description)
    {
        var role = new Role
        {
            Name = name,
            Description = description,
            RecordStatus = RecordStatus.Active
        };

        return role;
    }

    public void AddRolePrivilege(RolePrivilege rolePrivilege)
    {
        _rolePrivileges.Add(rolePrivilege);
    }

    public void Update(string name, string description, RecordStatus? recordStatus = null)
    {
        Name = name;
        Description = description;
        if (recordStatus.HasValue)
        {
            RecordStatus = recordStatus.Value;
        }
    }
    public void UpdateStatus(RecordStatus recordStatus)
    {
        RecordStatus = recordStatus;
    }
}
