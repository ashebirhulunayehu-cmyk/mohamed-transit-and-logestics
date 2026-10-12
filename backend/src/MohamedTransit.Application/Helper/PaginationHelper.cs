namespace MohamedTransit.Application.Helper;

public static class PaginationHelper
{
    public static async Task<PaginatedResult<T>> GetPaginatedResultAsync<T>(
        List<T> items,
        int pageNumber,
        int pageSize)
    {
        var totalItems = items.Count;
        var totalPages = (int)Math.Ceiling((double)totalItems / pageSize);

        var pagedItems = items
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return await Task.FromResult(new PaginatedResult<T>(pagedItems, totalItems, pageNumber, pageSize));
    }
}

public class PaginatedResult<T>
{
    public List<T> Items { get; set; }
    public int TotalItems { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalItems / PageSize);
    public bool HasPreviousPage => PageNumber > 1;
    public bool HasNextPage => PageNumber < TotalPages;

    public PaginatedResult(List<T> items, int totalItems, int pageNumber, int pageSize)
    {
        Items = items;
        TotalItems = totalItems;
        PageNumber = pageNumber;
        PageSize = pageSize;
    }
}
