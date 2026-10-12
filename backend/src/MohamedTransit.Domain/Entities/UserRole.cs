

namespace MohamedTransit.Domain.Entities;

public class UserRole
{
    public long Id { get; set; }

    public long UserId { get; set; }

    public User User { get; set; } = null!;

    public long RoleId { get; set; }

    public Role Role { get; set; } = null!;

    public static UserRole Create(long userId, long roleId)
    {
        return new UserRole
        {
            UserId = userId,
            RoleId = roleId
        };
    }
}
