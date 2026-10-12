namespace MohamedTransit.Application;

using FluentValidation;

using Microsoft.Extensions.DependencyInjection;

using MohamedTransit.Application.Helper;

/// <summary>
/// Dependency Injection extension methods for registering Application layer services,
/// MediatR handlers, FluentValidation rules, and Pipeline Behaviors.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = typeof(DependencyInjection).Assembly;

        // 1. Register MediatR handlers and pipeline behaviors
        services.AddMediatR(config =>
        {
            config.RegisterServicesFromAssembly(assembly);

            // Pipeline behavior registration order defines execution sequence:
            // Request -> LoggingBehavior -> ValidationBehavior -> TransactionBehavior -> Handler
           // config.AddOpenBehavior(typeof(LoggingBehavior<,>));
            //config.AddOpenBehavior(typeof(ValidationBehavior<,>));
           // config.AddOpenBehavior(typeof(TransactionBehavior<,>));
        });

        // 2. Register all FluentValidation validators automatically from this assembly
        services.AddValidatorsFromAssembly(assembly, includeInternalTypes: true);

        return services;
    }
}
