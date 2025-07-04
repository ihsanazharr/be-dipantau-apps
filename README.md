# be-dipantau-apps
## Perubahan Utama yang Dilakukan

### 1. **User.js** - Perbaikan Role & Permission System
**Perubahan:**
- ✅ Tambah field \`himpunanId\` untuk relasi dengan himpunan
- ✅ Tambah field \`isHimpunanAdmin\` untuk multiple admin per himpunan
- ✅ Perbaiki struktur \`permissions\` dengan field yang jelas
- ✅ Tambah hooks untuk auto-set permissions berdasarkan role
- ✅ Tambah method \`hasPermission()\` untuk checking permission

**Fitur Baru:**
- Multiple admin per himpunan
- Auto permission management
- Better role separation

### 2. **Himpunan.js** - Hapus Single Admin Constraint
**Perubahan:**
- ❌ Hapus field \`adminId\` (diganti dengan User.isHimpunanAdmin)
- ✅ Tambah field statistik: \`totalMembers\`, \`totalActivities\`, \`totalTasks\`
- ✅ Tambah unique constraint untuk field \`aka\`
- ✅ Perbaiki data types consistency

### 3. **Task.js** - Enhanced Task Management
**Perubahan:**
- ✅ Ubah status enum: \`available\` → \`claimed\` → \`in_progress\` → \`completed\`
- ✅ Tambah field \`claimedAt\` untuk tracking kapan task diambil
- ✅ Tambah field \`maxAssignees\` & \`currentAssignees\` untuk multi-user tasks
- ✅ Tambah field \`progressPercentage\` untuk tracking progress
- ✅ Tambah approval system: \`requiresApproval\`, \`approvalStatus\`, \`approvedById\`
- ✅ Tambah hooks untuk auto-update progress dan dates

**Fitur Baru:**
- Task selection flow (anggota bisa "claim" task)
- Multi-assignee support
- Approval workflow
- Progress tracking

### 4. **Activity.js** - Enhanced Activity Management
**Perubahan:**
- ✅ Perbaiki ID field configuration (autoIncrement)
- ✅ Tambah field \`maxParticipants\` & \`currentParticipants\`
- ✅ Tambah field \`isMandatory\` untuk kegiatan wajib
- ✅ Tambah field \`meetingLink\` & \`meetingPassword\` untuk online meeting
- ✅ Tambah field \`himpunanId\` & \`createdById\` untuk relasi
- ✅ Tambah hooks untuk auto-generate QR Code dan update status

**Fitur Baru:**
- Participant management
- Online meeting support
- Auto QR Code generation
- Better activity tracking

### 5. **Attendance.js** - Advanced Attendance Tracking
**Perubahan:**
- ✅ Perbaiki ID field configuration
- ✅ Tambah field \`attendanceMethod\` (qr_scan, manual, auto)
- ✅ Tambah GPS tracking: \`latitude\`, \`longitude\`
- ✅ Tambah field \`deviceInfo\`, \`ipAddress\` untuk security
- ✅ Tambah field \`duration\` untuk tracking durasi kehadiran
- ✅ Tambah verification system: \`isVerified\`, \`verifiedById\`, \`verifiedAt\`
- ✅ Tambah hooks untuk auto-calculate duration dan update participant count

**Fitur Baru:**
- GPS-based attendance
- Device tracking
- Admin verification system
- Duration calculation

### 6. **Notification.js** - Rich Notification System
**Perubahan:**
- ✅ Perbaiki ID field configuration
- ✅ Tambah notification types yang lebih spesifik
- ✅ Tambah field \`actionUrl\` & \`actionText\` untuk actionable notifications
- ✅ Tambah field \`metadata\` untuk data tambahan
- ✅ Tambah scheduling: \`scheduledAt\`, \`isSent\`
- ✅ Tambah multi-channel support: \`channels\` (in_app, email, push)
- ✅ Tambah relasi dengan Activity dan Task

**Fitur Baru:**
- Actionable notifications
- Scheduled notifications
- Multi-channel delivery
- Rich metadata support

### 7. **index.js** - Fixed Associations
**Perubahan:**
- ✅ Hapus konflik relasi User-Himpunan
- ✅ Tambah relasi untuk multiple admin per himpunan
- ✅ Tambah relasi untuk approval system di Task
- ✅ Tambah relasi untuk verification system di Attendance
- ✅ Tambah relasi Notification dengan Activity dan Task

## Struktur Role & Permission

### Super Admin
permissions: {
  canManageUsers: true,
  canManageHimpunan: true,
  canCreateTasks: true,
  canCreateActivities: true,
  canScanQR: true,
  canManageAttendance: true,
  canViewReports: true
}

### Admin Himpunan (isHimpunanAdmin = true)
permissions: {
  canManageUsers: true,        // Hanya untuk himpunannya
  canManageHimpunan: false,
  canCreateTasks: true,
  canCreateActivities: true,
  canScanQR: true,
  canManageAttendance: true,
  canViewReports: true
}


### Member/Anggota
permissions: {
  canManageUsers: false,
  canManageHimpunan: false,
  canCreateTasks: false,
  canCreateActivities: false,
  canScanQR: false,
  canManageAttendance: false,
  canViewReports: false
}

## Task Selection Flow

1. **Admin** membuat task dengan status \`available\`
2. **Anggota** melihat daftar task available
3. **Anggota** "claim" task → status berubah ke \`claimed\`, \`claimedAt\` diset
4. **Anggota** mulai mengerjakan → status \`in_progress\`
5. **Anggota** selesai → status \`completed\`, \`completionDate\` diset
6. **Admin** approve (jika \`requiresApproval = true\`) → \`approvalStatus = approved\`
7. **Score** ditambahkan ke anggota

## Attendance Flow

1. **Admin** buat activity dengan QR Code auto-generated
2. **Anggota** scan QR Code atau manual check-in
3. **System** record GPS, device info, timestamp
4. **Admin** verifikasi attendance (optional)
5. **System** calculate duration saat check-out

## Fitur Baru yang Didukung

✅ Multiple admin per himpunan  
✅ Task selection oleh anggota  
✅ GPS-based attendance  
✅ Rich notification system  
✅ Approval workflow  
✅ Progress tracking  
✅ Auto permission management  
✅ Device & security tracking  
✅ Multi-channel notifications  
✅ Scheduled notifications  

## Compatibility

Model ini **backward compatible** dengan sistem yang sudah ada, dengan tambahan field baru yang memiliki default value yang sesuai.

## Migration Notes

Jika menggunakan model lama, perlu migration untuk:
1. Tambah field baru di semua tabel
2. Update existing users dengan permissions yang sesuai
3. Set isHimpunanAdmin = true untuk existing admin
4. Generate QR Code untuk existing activities
