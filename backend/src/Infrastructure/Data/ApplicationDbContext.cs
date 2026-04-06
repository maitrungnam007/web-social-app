using Core.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<User>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }
    
    public DbSet<Post> Posts => Set<Post>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<Like> Likes => Set<Like>();
    public DbSet<Friendship> Friendships => Set<Friendship>();
    public DbSet<Story> Stories => Set<Story>();
    public DbSet<StoryView> StoryViews => Set<StoryView>();
    public DbSet<StoryHighlight> StoryHighlights => Set<StoryHighlight>();
    public DbSet<StoryHighlightItem> StoryHighlightItems => Set<StoryHighlightItem>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<Hashtag> Hashtags => Set<Hashtag>();
    public DbSet<PostHashtag> PostHashtags => Set<PostHashtag>();
    public DbSet<Report> Reports => Set<Report>();
    public DbSet<HiddenPost> HiddenPosts => Set<HiddenPost>();
    
    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        
        // Cấu hình Post
        builder.Entity<Post>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Content).IsRequired().HasMaxLength(5000);
            entity.HasOne(e => e.User)
                .WithMany(u => u.Posts)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            
            // Indexes cho query phổ biến
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.IsDeleted);
            entity.HasIndex(e => new { e.UserId, e.IsDeleted });
            entity.HasIndex(e => new { e.IsDeleted, e.CreatedAt });
        });
        
        // Cấu hình Comment
        builder.Entity<Comment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Content).IsRequired().HasMaxLength(1000);
            entity.HasOne(e => e.Post)
                .WithMany(p => p.Comments)
                .HasForeignKey(e => e.PostId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.User)
                .WithMany(u => u.Comments)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.ParentComment)
                .WithMany(c => c.Replies)
                .HasForeignKey(e => e.ParentCommentId)
                .OnDelete(DeleteBehavior.Restrict);
            
            // Indexes
            entity.HasIndex(e => e.PostId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.IsDeleted);
            entity.HasIndex(e => new { e.PostId, e.IsDeleted });
        });
        
        // Cấu hình Like
        builder.Entity<Like>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User)
                .WithMany(u => u.Likes)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Post)
                .WithMany(p => p.Likes)
                .HasForeignKey(e => e.PostId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Comment)
                .WithMany(c => c.Likes)
                .HasForeignKey(e => e.CommentId)
                .OnDelete(DeleteBehavior.Restrict);
            
            // Indexes cho query phổ biến
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.PostId);
            entity.HasIndex(e => e.CommentId);
            entity.HasIndex(e => new { e.PostId, e.UserId });
            entity.HasIndex(e => new { e.CommentId, e.UserId });
        });
        
        // Cấu hình Friendship
        builder.Entity<Friendship>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            // Index cho query tìm kiếm friendship theo user và status
            entity.HasIndex(e => e.RequesterId);
            entity.HasIndex(e => e.AddresseeId);
            entity.HasIndex(e => e.Status);
            // Composite index cho query phổ biến
            entity.HasIndex(e => new { e.RequesterId, e.Status });
            entity.HasIndex(e => new { e.AddresseeId, e.Status });
            
            entity.HasOne(e => e.Requester)
                .WithMany(u => u.FriendshipsInitiated)
                .HasForeignKey(e => e.RequesterId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Addressee)
                .WithMany(u => u.FriendshipsReceived)
                .HasForeignKey(e => e.AddresseeId)
                .OnDelete(DeleteBehavior.Cascade);
        });
        
        // Cấu hình Story
        builder.Entity<Story>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User)
                .WithMany(u => u.Stories)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            
            // Indexes
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.ExpiresAt);
            entity.HasIndex(e => e.IsDeleted);
            entity.HasIndex(e => new { e.IsDeleted, e.ExpiresAt });
        });
        
        // Cấu hình StoryView
        builder.Entity<StoryView>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Story)
                .WithMany(s => s.StoryViews)
                .HasForeignKey(e => e.StoryId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Viewer)
                .WithMany()
                .HasForeignKey(e => e.ViewerId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        
        // Cấu hình StoryHighlight
        builder.Entity<StoryHighlight>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(50);
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.UserId);
        });
        
        // Cấu hình StoryHighlightItem
        builder.Entity<StoryHighlightItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Highlight)
                .WithMany(h => h.Items)
                .HasForeignKey(e => e.HighlightId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Story)
                .WithMany(s => s.HighlightItems)
                .HasForeignKey(e => e.StoryId)
                .OnDelete(DeleteBehavior.NoAction);
            entity.HasIndex(e => new { e.HighlightId, e.StoryId }).IsUnique();
        });
        
        // Cấu hình Notification
        builder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User)
                .WithMany(u => u.Notifications)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            
            // Indexes
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.IsRead);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => new { e.UserId, e.IsRead });
        });
        
        // Cấu hình Hashtag
        builder.Entity<Hashtag>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(50);
            entity.HasIndex(e => e.Name).IsUnique();
        });
        
        // Cấu hình PostHashtag (Quan hệ Many-to-Many)
        builder.Entity<PostHashtag>(entity =>
        {
            entity.HasKey(e => new { e.PostId, e.HashtagId });
            entity.HasOne(e => e.Post)
                .WithMany(p => p.PostHashtags)
                .HasForeignKey(e => e.PostId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Hashtag)
                .WithMany(h => h.PostHashtags)
                .HasForeignKey(e => e.HashtagId)
                .OnDelete(DeleteBehavior.Cascade);
        });
        
        // Cấu hình Report (Báo cáo nội dung)
        builder.Entity<Report>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TargetType).IsRequired();
            entity.Property(e => e.TargetId).IsRequired();
            
            // Quan hệ với Post (optional) - dùng Cascade vì Post là primary target
            entity.HasOne(e => e.Post)
                .WithMany(p => p.Reports)
                .HasForeignKey(e => e.PostId)
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired(false);
            
            // Quan hệ với Comment (optional) - dùng NoAction để tránh cascade cycle
            entity.HasOne(e => e.Comment)
                .WithMany()
                .HasForeignKey(e => e.CommentId)
                .OnDelete(DeleteBehavior.NoAction)
                .IsRequired(false);
            
            // Quan hệ với ReportedUser (optional) - dùng NoAction để tránh cascade cycle
            entity.HasOne(e => e.ReportedUser)
                .WithMany()
                .HasForeignKey(e => e.ReportedUserId)
                .OnDelete(DeleteBehavior.NoAction)
                .IsRequired(false);
            
            // Quan hệ với Reporter
            entity.HasOne(e => e.Reporter)
                .WithMany(u => u.Reports)
                .HasForeignKey(e => e.ReporterId)
                .OnDelete(DeleteBehavior.Restrict);
            
            // Quan hệ với Admin xử lý (optional)
            entity.HasOne(e => e.ResolvedByUser)
                .WithMany()
                .HasForeignKey(e => e.ResolvedBy)
                .OnDelete(DeleteBehavior.Restrict)
                .IsRequired(false);
            
            // Indexes
            entity.HasIndex(e => e.TargetType);
            entity.HasIndex(e => e.TargetId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.ReporterId);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => new { e.TargetType, e.TargetId, e.ReporterId });
        });
        
        // Cấu hình HiddenPost (Bài viết bị ẩn bởi user)
        builder.Entity<HiddenPost>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            // Quan hệ với User
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            
            // Quan hệ với Post - dùng NoAction để tránh cascade cycle
            entity.HasOne(e => e.Post)
                .WithMany()
                .HasForeignKey(e => e.PostId)
                .OnDelete(DeleteBehavior.NoAction);
            
            // Unique index để mỗi user chỉ ẩn một bài viết một lần
            entity.HasIndex(e => new { e.UserId, e.PostId }).IsUnique();
        });
        
        // Thêm dữ liệu Roles mặc định
        builder.Entity<Microsoft.AspNetCore.Identity.IdentityRole>().HasData(
            new Microsoft.AspNetCore.Identity.IdentityRole { Id = "1", Name = "Admin", NormalizedName = "ADMIN" },
            new Microsoft.AspNetCore.Identity.IdentityRole { Id = "2", Name = "User", NormalizedName = "USER" }
        );
    }
}
