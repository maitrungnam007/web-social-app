using Core.Entities;
using Core.Interfaces;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public interface IPostRepository : IGenericRepository<Post>
{
    Task<Post?> GetPostWithDetailsAsync(int id);
    Task<IEnumerable<Post>> GetPostsByUserIdAsync(string userId);
    Task<IEnumerable<Post>> GetFeedPostsAsync(string userId, int page, int pageSize);
}

public class PostRepository : GenericRepository<Post>, IPostRepository
{
    public PostRepository(ApplicationDbContext context) : base(context) { }
    
    public async Task<Post?> GetPostWithDetailsAsync(int id)
    {
        return await _dbSet
            .Include(p => p.User)
            .Include(p => p.Comments)
            .Include(p => p.Likes)
            .Include(p => p.PostHashtags)
            .ThenInclude(ph => ph.Hashtag)
            .FirstOrDefaultAsync(p => p.Id == id);
    }
    
    public async Task<IEnumerable<Post>> GetPostsByUserIdAsync(string userId)
    {
        return await _dbSet
            .Where(p => p.UserId == userId && !p.IsDeleted)
            .Include(p => p.User)
            .Include(p => p.Likes)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }
    
    public async Task<IEnumerable<Post>> GetFeedPostsAsync(string userId, int page, int pageSize)
    {
        var friendIds = await _context.Friendships
            .Where(f => (f.RequesterId == userId || f.AddresseeId == userId) && f.Status == Core.Enums.FriendshipStatus.Accepted)
            .Select(f => f.RequesterId == userId ? f.AddresseeId : f.RequesterId)
            .ToListAsync();
        
        var allUserIds = new List<string> { userId }.Concat(friendIds).ToList();
        
        return await _dbSet
            .Where(p => allUserIds.Contains(p.UserId) && !p.IsDeleted)
            .Include(p => p.User)
            .Include(p => p.Likes)
            .Include(p => p.PostHashtags)
            .ThenInclude(ph => ph.Hashtag)
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }
}
