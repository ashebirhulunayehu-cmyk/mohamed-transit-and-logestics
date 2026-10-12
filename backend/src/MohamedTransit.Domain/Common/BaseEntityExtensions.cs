using System;
using MohamedTransit.Domain.Common;

namespace MohamedTransit.Domain.Common
{
    public static class BaseEntityExtensions
    {
        // Provides a fallback UpdateAudit() extension if BaseEntity does not implement it.
        // This sets an UpdatedAt or UpdatedOn property to DateTime.UtcNow if present.
        public static void UpdateAudit(this BaseEntity entity)
        {
            if (entity == null) return;

            var type = entity.GetType();

            // Try common property names for last-modified timestamps
            var prop = type.GetProperty("UpdatedAt") ?? type.GetProperty("UpdatedOn") ?? type.GetProperty("ModifiedAt") ?? type.GetProperty("ModifiedOn");
            if (prop != null && prop.CanWrite)
            {
                var propType = prop.PropertyType;
                if (propType == typeof(DateTime) || propType == typeof(DateTime?))
                {
                    prop.SetValue(entity, DateTime.UtcNow);
                }
            }
        }
    }
}
