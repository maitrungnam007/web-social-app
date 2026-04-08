namespace Core.DTOs.Common;

// DTO cho thong ke noi dung
public class ContentStatsDto
{
    public int TotalComments { get; set; }
    public int HiddenComments { get; set; }
    public int TotalPosts { get; set; }
    public int HiddenPosts { get; set; }
}
