using Core.Entities;
using Core.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data;

// Lớp chứa dữ liệu mẫu để seed vào database
public static class SeedData
{
    // Seed dữ liệu mẫu vào database
    public static async Task SeedAsync(ApplicationDbContext context, UserManager<User> userManager, RoleManager<IdentityRole> roleManager)
    {
        // Seed Roles nếu chưa có
        if (!await roleManager.RoleExistsAsync("Admin"))
        {
            await roleManager.CreateAsync(new IdentityRole("Admin"));
        }
        if (!await roleManager.RoleExistsAsync("User"))
        {
            await roleManager.CreateAsync(new IdentityRole("User"));
        }

        // Seed Users
        if (!context.Users.Any())
        {
            for (int i = 1; i <= 20; i++)
            {
                var user = new User
                {
                    UserName = $"user{i}",
                    Email = $"user{i}@example.com",
                    FirstName = GetFirstName(i),
                    LastName = GetLastName(i),
                    Bio = $"Xin chào! Tôi là user số {i}.",
                    CreatedAt = DateTime.Now.AddDays(-Random.Shared.Next(1, 365)),
                    EmailConfirmed = true
                };
                
                var result = await userManager.CreateAsync(user, "Password123!");
                if (!result.Succeeded)
                {
                    // Log error if needed
                }
            }

            // Thêm admin
            var admin = new User
            {
                UserName = "admin",
                Email = "admin@interacthub.com",
                FirstName = "Admin",
                LastName = "System",
                Bio = "Quản trị viên hệ thống",
                CreatedAt = DateTime.Now.AddDays(-500),
                EmailConfirmed = true
            };
            await userManager.CreateAsync(admin, "Admin123!");
        }

        // Seed Posts
        if (!context.Posts.Any())
        {
            var userIds = await context.Users.Select(u => u.Id).ToListAsync();
            var posts = new List<Post>();

            for (int i = 1; i <= 20; i++)
            {
                var post = new Post
                {
                    Content = GetPostContent(i),
                    ImageUrl = i % 3 == 0 ? $"https://picsum.photos/seed/post{i}/800/600" : null,
                    UserId = userIds[Random.Shared.Next(userIds.Count)],
                    CreatedAt = DateTime.Now.AddDays(-Random.Shared.Next(1, 100)),
                    IsDeleted = false
                };
                posts.Add(post);
            }

            context.Posts.AddRange(posts);
            await context.SaveChangesAsync();
        }

        // Seed Comments
        if (!context.Comments.Any())
        {
            var userIds = await context.Users.Select(u => u.Id).ToListAsync();
            var postIds = await context.Posts.Select(p => p.Id).ToListAsync();
            var comments = new List<Comment>();

            for (int i = 1; i <= 20; i++)
            {
                var comment = new Comment
                {
                    Content = GetCommentContent(i),
                    PostId = postIds[Random.Shared.Next(postIds.Count)],
                    UserId = userIds[Random.Shared.Next(userIds.Count)],
                    CreatedAt = DateTime.Now.AddDays(-Random.Shared.Next(1, 50)),
                    IsDeleted = false
                };
                comments.Add(comment);
            }

            context.Comments.AddRange(comments);
            await context.SaveChangesAsync();
        }

        // Seed Likes
        if (!context.Likes.Any())
        {
            var userIds = await context.Users.Select(u => u.Id).ToListAsync();
            var postIds = await context.Posts.Select(p => p.Id).ToListAsync();
            var commentIds = await context.Comments.Select(c => c.Id).ToListAsync();
            var likes = new List<Like>();

            for (int i = 1; i <= 20; i++)
            {
                var like = new Like
                {
                    UserId = userIds[Random.Shared.Next(userIds.Count)],
                    PostId = i % 2 == 0 ? postIds[Random.Shared.Next(postIds.Count)] : null,
                    CommentId = i % 2 == 1 ? commentIds[Random.Shared.Next(commentIds.Count)] : null,
                    CreatedAt = DateTime.Now.AddDays(-Random.Shared.Next(1, 30))
                };
                likes.Add(like);
            }

            context.Likes.AddRange(likes);
            await context.SaveChangesAsync();
        }

        // Seed Friendships
        if (!context.Friendships.Any())
        {
            var userIds = await context.Users.Select(u => u.Id).ToListAsync();
            var friendships = new List<Friendship>();

            for (int i = 1; i <= 20; i++)
            {
                string requesterId, addresseeId;
                do
                {
                    requesterId = userIds[Random.Shared.Next(userIds.Count)];
                    addresseeId = userIds[Random.Shared.Next(userIds.Count)];
                } while (requesterId == addresseeId);

                var friendship = new Friendship
                {
                    RequesterId = requesterId,
                    AddresseeId = addresseeId,
                    Status = (FriendshipStatus)Random.Shared.Next(0, 3),
                    CreatedAt = DateTime.Now.AddDays(-Random.Shared.Next(1, 200)),
                    UpdatedAt = DateTime.Now.AddDays(-Random.Shared.Next(1, 50))
                };
                friendships.Add(friendship);
            }

            context.Friendships.AddRange(friendships);
            await context.SaveChangesAsync();
        }

        // Seed Stories
        if (!context.Stories.Any())
        {
            var userIds = await context.Users.Select(u => u.Id).ToListAsync();
            var stories = new List<Story>();

            for (int i = 1; i <= 20; i++)
            {
                var story = new Story
                {
                    Content = GetStoryContent(i),
                    MediaUrl = i % 2 == 0 ? $"https://picsum.photos/seed/story{i}/400/600" : null,
                    MediaType = i % 2 == 0 ? "image" : null,
                    UserId = userIds[Random.Shared.Next(userIds.Count)],
                    CreatedAt = DateTime.Now.AddHours(-Random.Shared.Next(1, 20)),
                    ExpiresAt = DateTime.Now.AddHours(24 - Random.Shared.Next(1, 20)),
                    IsDeleted = false
                };
                stories.Add(story);
            }

            context.Stories.AddRange(stories);
            await context.SaveChangesAsync();
        }

        // Seed StoryViews
        if (!context.StoryViews.Any())
        {
            var userIds = await context.Users.Select(u => u.Id).ToListAsync();
            var storyIds = await context.Stories.Select(s => s.Id).ToListAsync();
            var storyViews = new List<StoryView>();

            for (int i = 1; i <= 20; i++)
            {
                var storyView = new StoryView
                {
                    StoryId = storyIds[Random.Shared.Next(storyIds.Count)],
                    ViewerId = userIds[Random.Shared.Next(userIds.Count)],
                    ViewedAt = DateTime.Now.AddHours(-Random.Shared.Next(1, 10))
                };
                storyViews.Add(storyView);
            }

            context.StoryViews.AddRange(storyViews);
            await context.SaveChangesAsync();
        }

        // Seed Notifications
        if (!context.Notifications.Any())
        {
            var userIds = await context.Users.Select(u => u.Id).ToListAsync();
            var notifications = new List<Notification>();

            for (int i = 1; i <= 20; i++)
            {
                var notification = new Notification
                {
                    UserId = userIds[Random.Shared.Next(userIds.Count)],
                    Type = (NotificationType)Random.Shared.Next(0, 6),
                    Title = GetNotificationTitle(i),
                    Message = GetNotificationMessage(i),
                    RelatedEntityId = Random.Shared.Next(1, 20).ToString(),
                    RelatedEntityType = Random.Shared.Next(0, 2) == 0 ? "Post" : "Comment",
                    IsRead = Random.Shared.Next(0, 2) == 1,
                    CreatedAt = DateTime.Now.AddHours(-Random.Shared.Next(1, 100))
                };
                notifications.Add(notification);
            }

            context.Notifications.AddRange(notifications);
            await context.SaveChangesAsync();
        }

        // Seed Hashtags
        if (!context.Hashtags.Any())
        {
            var hashtags = new List<Hashtag>
            {
                new Hashtag { Name = "vacation", CreatedAt = DateTime.Now.AddDays(-100) },
                new Hashtag { Name = "food", CreatedAt = DateTime.Now.AddDays(-90) },
                new Hashtag { Name = "travel", CreatedAt = DateTime.Now.AddDays(-80) },
                new Hashtag { Name = "photography", CreatedAt = DateTime.Now.AddDays(-70) },
                new Hashtag { Name = "music", CreatedAt = DateTime.Now.AddDays(-60) },
                new Hashtag { Name = "fitness", CreatedAt = DateTime.Now.AddDays(-50) },
                new Hashtag { Name = "coding", CreatedAt = DateTime.Now.AddDays(-40) },
                new Hashtag { Name = "nature", CreatedAt = DateTime.Now.AddDays(-30) },
                new Hashtag { Name = "art", CreatedAt = DateTime.Now.AddDays(-20) },
                new Hashtag { Name = "life", CreatedAt = DateTime.Now.AddDays(-10) }
            };

            context.Hashtags.AddRange(hashtags);
            await context.SaveChangesAsync();
        }

        // Seed PostHashtags
        if (!context.PostHashtags.Any())
        {
            var postIds = await context.Posts.Select(p => p.Id).ToListAsync();
            var hashtagIds = await context.Hashtags.Select(h => h.Id).ToListAsync();
            var postHashtags = new List<PostHashtag>();

            for (int i = 1; i <= 20; i++)
            {
                var postHashtag = new PostHashtag
                {
                    PostId = postIds[Random.Shared.Next(postIds.Count)],
                    HashtagId = hashtagIds[Random.Shared.Next(hashtagIds.Count)]
                };
                postHashtags.Add(postHashtag);
            }

            context.PostHashtags.AddRange(postHashtags);
            await context.SaveChangesAsync();
        }

        // Seed Reports
        if (!context.Reports.Any())
        {
            var userIds = await context.Users.Select(u => u.Id).ToListAsync();
            var postIds = await context.Posts.Select(p => p.Id).ToListAsync();
            var reports = new List<Report>();

            for (int i = 1; i <= 10; i++)
            {
                var report = new Report
                {
                    TargetType = ReportTargetType.Post,
                    TargetId = postIds[Random.Shared.Next(postIds.Count)],
                    PostId = postIds[Random.Shared.Next(postIds.Count)],
                    ReporterId = userIds[Random.Shared.Next(userIds.Count)],
                    Reason = (ReportReason)Random.Shared.Next(0, 5),
                    Description = GetReportDescription(i),
                    Status = (ReportStatus)Random.Shared.Next(0, 3),
                    CreatedAt = DateTime.Now.AddDays(-Random.Shared.Next(1, 30)),
                    ResolvedAt = i % 3 == 0 ? DateTime.Now.AddDays(-Random.Shared.Next(1, 10)) : null,
                    ResolvedBy = i % 3 == 0 ? userIds[0] : null
                };
                reports.Add(report);
            }

            context.Reports.AddRange(reports);
            await context.SaveChangesAsync();
        }
    }

    // Các phương thức helper để tạo nội dung mẫu
    private static string GetFirstName(int index)
    {
        var names = new[] { "Minh", "Hùng", "Lan", "Hương", "Tuấn", "Mai", "Nam", "Nga", "Dũng", "Thảo", 
                           "Văn", "Hà", "Quân", "Yến", "Phong", "Ngọc", "Đức", "Trang", "Thắng", "Nhung" };
        return names[(index - 1) % names.Length];
    }

    private static string GetLastName(int index)
    {
        var names = new[] { "Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Vũ", "Võ", "Đặng", "Bùi",
                           "Đỗ", "Hồ", "Ngô", "Dương", "Đinh", "Lý", "Trịnh", "Phan", "Chu", "Tạ" };
        return names[(index - 1) % names.Length];
    }

    private static string GetPostContent(int index)
    {
        var contents = new[]
        {
            "Hôm nay là một ngày tuyệt vời! ☀️",
            "Vừa đi du lịch về, quá đã! 🌴",
            "Món ăn này ngon quá mọi người ơi 😋",
            "Chia sẻ chút về công việc lập trình 💻",
            "Bức ảnh này chụp tại Đà Lạt 🌸",
            "Cuối tuần vui vẻ cả nhà nhé! 🎉",
            "Mới học được kỹ năng mới hay hay 📚",
            "Sáng nay chạy bộ 5km, cảm giác sảng khoái 🏃",
            "Review quán cà phê mới mở gần nhà ☕",
            "Chia sẻ chút về cuộc sống thường ngày 💭",
            "Hôm nay trời đẹp quá! Mọi người có kế hoạch gì không? 🌈",
            "Vừa hoàn thành dự án lớn, mệt nhưng vui! 🎯",
            "Cuốn sách này hay quá, recommend cho mọi người 📖",
            "Mùa hoa nở rồi, đi chụp ảnh thôi! 📸",
            "Bài hát này hay quá, nghe hoài không chán 🎵",
            "Vừa thử công thức nấu ăn mới 🍳",
            "Chia sẻ chút về kinh nghiệm làm việc 💼",
            "Hôm nay có chuyện vui muốn kể với mọi người 😊",
            "Cảm ơn mọi người đã luôn ủng hộ mình! ❤️",
            "Chúc mọi người một tuần làm việc hiệu quả! 💪"
        };
        return contents[(index - 1) % contents.Length];
    }

    private static string GetCommentContent(int index)
    {
        var contents = new[]
        {
            "Bài viết hay quá! 👍",
            "Cảm ơn bạn đã chia sẻ nhé",
            "Mình cũng nghĩ như vậy",
            "Hình đẹp quá! 😍",
            "Quán này ở đâu vậy bạn?",
            "Để mình thử xem sao",
            "Rất hữu ích, cảm ơn bạn!",
            "Chúc mừng bạn nhé! 🎉",
            "Mình rất thích bài viết này",
            "Có thể cho mình xin thông tin thêm không?",
            "Đúng ý mình luôn! 💯",
            "Bao giờ tổ chức đi bạn?",
            "Mình sẽ ghé thử quán này",
            "Bài viết rất tâm huyết",
            "Chia sẻ thêm về chủ đề này nhé!",
            "Mình học được nhiều điều từ bài viết",
            "Rất mong chờ bài viết tiếp theo",
            "Bạn viết rất hay! 👏",
            "Mình đồng ý với quan điểm này",
            "Cảm ơn thông tin bổ ích!"
        };
        return contents[(index - 1) % contents.Length];
    }

    private static string GetStoryContent(int index)
    {
        var contents = new[]
        {
            "Chào buổi sáng! ☀️",
            "Đang đi cafe nè ☕",
            "View đẹp quá! 🌅",
            "Món ngon! 😋",
            "Chill cuối tuần 🎵",
            "Sống ảo tí 📸",
            "Đi chơi nè! 🎉",
            "Yêu cuộc sống ❤️",
            "Happy day! 😊",
            "Good vibes only ✨",
            "Buổi tối chill 🌙",
            "Sáng tạo tí 🎨",
            "Đi làm về mệt quá",
            "Cuộc sống muôn màu 🌈",
            "Tâm trạng hôm nay 💭",
            "Chia sẻ khoảnh khắc 📷",
            "Đi dạo phố nào 🚶",
            "Ngày mới tốt lành!",
            "Thư giãn tí nào 🧘",
            "Enjoy the moment 🎶"
        };
        return contents[(index - 1) % contents.Length];
    }

    private static string GetNotificationTitle(int index)
    {
        var titles = new[]
        {
            "Có người thích bài viết của bạn",
            "Bình luận mới",
            "Lời mời kết bạn",
            "Có người theo dõi bạn",
            "Bài viết được chia sẻ",
            "Tag trong bình luận"
        };
        return titles[(index - 1) % titles.Length];
    }

    private static string GetNotificationMessage(int index)
    {
        var messages = new[]
        {
            "đã thích bài viết của bạn",
            "đã bình luận về bài viết của bạn",
            "đã gửi lời mời kết bạn",
            "đã bắt đầu theo dõi bạn",
            "đã chia sẻ bài viết của bạn",
            "đã tag bạn trong một bình luận"
        };
        return messages[(index - 1) % messages.Length];
    }

    private static string GetReportDescription(int index)
    {
        var descriptions = new[]
        {
            "Nội dung không phù hợp",
            "Spam hoặc quảng cáo",
            "Thông tin sai lệch",
            "Ngôn từ xúc phạm",
            "Vi phạm bản quyền",
            "Nội dung bạo lực",
            "Hình ảnh nhạy cảm",
            "Lừa đảo hoặc gian lận",
            "Quấy rối người dùng khác",
            "Vi phạm quy định cộng đồng"
        };
        return descriptions[(index - 1) % descriptions.Length];
    }
}
