namespace Core.Entities;

public class PostHashtag
{
    public int PostId { get; set; }
    public virtual Post Post { get; set; } = null!;
    
    public int HashtagId { get; set; }
    public virtual Hashtag Hashtag { get; set; } = null!;
}
