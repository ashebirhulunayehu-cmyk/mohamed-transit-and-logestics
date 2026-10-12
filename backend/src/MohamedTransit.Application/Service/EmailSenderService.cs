using System.Net;
using System.Net.Mail;

using Microsoft.Extensions.Options;

using MohamedTransit.Application.Helper;

namespace MohamedTransit.Application.Services;

public class EmailSenderService
{
    private readonly Settings _emailSettings;

    public EmailSenderService(IOptions<Settings> emailSettings)
    {
        _emailSettings = emailSettings.Value ?? throw new ArgumentNullException(nameof(emailSettings));

        if (string.IsNullOrWhiteSpace(_emailSettings?.EmailSettings?.Sender))
        {
            throw new InvalidOperationException(
                "Email sender is not configured. Set EmailSettings:EmailSettings:Sender in configuration.");
        }
    }

    public async Task SendEmailAsync(
        string message,
        string subject,
        string[] toAddress,
        string[]? ccAddress = null,
        string[]? attachements = null)
    {
        await Execute(
            message,
            subject,
            toAddress,
            ccAddress,
            attachements);
    }

    public async Task Execute(
        string message,
        string subject,
        string[]? toAddress,
        string[]? ccAddress,
        string[]? attachements)
    {
        if ((toAddress == null || toAddress.Length == 0) &&
            (ccAddress == null || ccAddress.Length == 0))
        {
            return;
        }

        var senderName = string.IsNullOrWhiteSpace(_emailSettings.EmailSettings.SenderName)
            ? "Mohamed Transit Group"
            : _emailSettings.EmailSettings.SenderName;

        var senderAddress = _emailSettings.EmailSettings.Sender.Trim();

        using var mail = new MailMessage
        {
            From = new MailAddress(senderAddress, senderName),
            Subject = subject,
            Body = message,
            IsBodyHtml = true,
            Priority = MailPriority.High
        };
        if (toAddress != null)
        {
            foreach (var to in toAddress)
            {
                if (!string.IsNullOrWhiteSpace(to))
                {
                    mail.To.Add(new MailAddress(to.Trim()));
                }
            }
        }

        if (ccAddress != null)
        {
            foreach (var cc in ccAddress)
            {
                if (!string.IsNullOrWhiteSpace(cc))
                {
                    mail.CC.Add(new MailAddress(cc.Trim()));
                }
            }
        }

        if (attachements != null)
        {
            foreach (var fileName in attachements)
            {
                if (!string.IsNullOrWhiteSpace(fileName))
                {
                    mail.Attachments.Add(new Attachment(fileName));
                }
            }
        }

        using var smtp = new SmtpClient(_emailSettings.EmailSettings.MailServer, _emailSettings.EmailSettings.MailPort)
        {
            Credentials = new NetworkCredential(
        _emailSettings.EmailSettings.Sender,
        _emailSettings.EmailSettings.Password
    ),
            EnableSsl = true,
            Timeout = 20000
        };
    }
}
