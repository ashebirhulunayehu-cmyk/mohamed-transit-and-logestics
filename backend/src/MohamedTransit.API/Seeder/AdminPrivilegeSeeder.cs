using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.Extensions.DependencyInjection;

using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.API;

public static class AdminPrivilegeSeeder
{
    public static void Seed(IServiceProvider services)
    {
        try
        {
            using var scope = services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var actionDescriptorProvider = scope.ServiceProvider.GetRequiredService<IActionDescriptorCollectionProvider>();

            // 1. Seed privileges (db.Privileges - plural)
            var actions = actionDescriptorProvider.ActionDescriptors.Items
                .OfType<ControllerActionDescriptor>()
                .Where(a => !a.ControllerName.Contains("Health"))
                .ToList();

            foreach (var action in actions)
            {
                var actionKey = $"{action.ControllerName}-{action.ActionName}";

                if (!db.Privileges.Any(p => p.Action == actionKey))
                {
                    // Action እና Description private set ካላቸው በ Create method መጠቀም
                    var privilege = Privilege.Create(actionKey, $"Access {action.ControllerName}.{action.ActionName}");
                    db.Privileges.Add(privilege);
                }
            }

            db.SaveChanges();

            // 2. Ensure SuperAdmin role exists (db.Roles - plural)
            var superAdminRole = db.Roles.FirstOrDefault(r => r.Name == "SuperAdmin");

            if (superAdminRole == null)
            {
                superAdminRole = Role.Create("SuperAdmin", "Super administrator with all privileges");
                db.Roles.Add(superAdminRole);
                db.SaveChanges();
            }

            // 3. Assign all privileges to SuperAdmin (db.RolePrivileges - plural)
            var allPrivileges = db.Privileges.ToList();

            foreach (var privilege in allPrivileges)
            {
                bool exists = db.RolePrivileges.Any(rp =>
                    rp.RoleId == superAdminRole.Id &&
                    rp.PrivilegeId == privilege.Id);

                if (!exists)
                {
                    var rolePrivilege = RolePrivilege.Create(superAdminRole.Id, privilege.Id);
                    superAdminRole.AddRolePrivilege(rolePrivilege);
                    db.RolePrivileges.Add(rolePrivilege);
                }
            }

            db.SaveChanges();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in AdminPrivilegeSeeder.Seed: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            throw;
        }
    }
}
