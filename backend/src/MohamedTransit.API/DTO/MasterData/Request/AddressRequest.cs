namespace MohamedTransit.API;

public class AddressRequest
{

    public IFormFile KebeleId { get; set; }

    public string NationalId { get; set; }


    public string Phone1 { get; set; }


    public string Phone2 { get; set; } = string.Empty;


    public string Addres { get; set; } // Corrected from 'Addres'

    public string Email { get; set; }

    public IFormFile LegalDocument { get; set; }

    public string Name { get; set; }


    public long UserId { get; set; }

}
public class UpdateAddressRequest
{
    public long Id { get; set; }

    public IFormFile KebeleId { get; set; }

    public string NationalId { get; set; }


    public string Phone1 { get; set; }


    public string Phone2 { get; set; } = string.Empty;


    public string Addres { get; set; } // Corrected from 'Addres'

    public string Email { get; set; }

    public IFormFile LegalDocument { get; set; }

    public string Name { get; set; }
    public long UserId { get; set; }


}
