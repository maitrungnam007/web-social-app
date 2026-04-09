// Tao avatar mac dinh tu ho ten hoac userName
// Hien 2 chu cai dau tien cua ho ten (vi du: "Nguyen Van A" -> "NA")
export function getDefaultAvatarUrl(
  firstName?: string | null,
  lastName?: string | null,
  userName?: string,
  size: number = 128
): string {
  let displayName: string
  
  if (firstName && lastName) {
    // Lay chu cai dau tien cua ho va ten
    // Vi du: "Nguyen Van A" -> "NA"
    const nameParts = `${firstName} ${lastName}`.trim().split(' ')
    const initials = nameParts.length >= 2 
      ? nameParts[0][0] + nameParts[nameParts.length - 1][0]
      : nameParts[0].substring(0, 2)
    displayName = initials.toUpperCase()
  } else if (firstName) {
    // Chi co firstName, lay 2 chu cai dau
    displayName = firstName.substring(0, 2).toUpperCase()
  } else if (userName) {
    // Chi co userName, lay 2 chu cai dau
    displayName = userName.substring(0, 2).toUpperCase()
  } else {
    displayName = 'U'
  }
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&size=${size}`
}

// Lay URL avatar hoan chinh (uu tien avatar thuc te, neu khong co thi dung mac dinh)
export function getAvatarUrl(
  avatarUrl?: string | null,
  firstName?: string | null,
  lastName?: string | null,
  userName?: string,
  size: number = 128
): string {
  if (avatarUrl) {
    return `http://localhost:5259/api/files/${avatarUrl}`
  }
  return getDefaultAvatarUrl(firstName, lastName, userName, size)
}
