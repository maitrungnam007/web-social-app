using Core.Entities;
using Core.Interfaces;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public interface IUserRepository : IGenericRepository<User>
{
    Task<User?> GetUserWithPostsAsync(string id);
    Task<User?> GetByUserNameAsync(string userName);
    Task<User?> GetByEmailAsync(string email);
}

public class UserRepository : GenericRepository<User>, IUserRepository
{
    public UserRepository(ApplicationDbContext context) : base(context) { }
    
    public async Task<User?> GetUserWithPostsAsync(string id)
    {
        return await _dbSet
            .Include(u => u.Posts)
            .FirstOrDefaultAsync(u => u.Id == id);
    }
    
    public async Task<User?> GetByUserNameAsync(string userName)
    {
        return await _dbSet.FirstOrDefaultAsync(u => u.UserName == userName);
    }
    
    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _dbSet.FirstOrDefaultAsync(u => u.Email == email);
    }
}
