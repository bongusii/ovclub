// dashboard.js

// 1. KẾT NỐI SUPABASE
const SUPABASE_URL = 'https://gzvyvujgpuexdaubqrmy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dnl2dWpncHVleGRhdWJxcm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDg0MDUsImV4cCI6MjA3NjM4NDQwNX0.9QaC0I26YP2uiZeTuVB-GK3yQR2jwjq6FnNLQKLNrMw';

// Khởi tạo Supabase client (phải dùng window.supabase vì chúng ta dùng CDN)
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. CHẠY SAU KHI HTML TẢI XONG
document.addEventListener('DOMContentLoaded', () => {
    
    // 2.1. Lấy nút Đăng xuất và gán sự kiện
    // (Làm việc này bên trong DOMContentLoaded là AN TOÀN)
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('Lỗi khi đăng xuất:', error);
            } else {
                window.location.href = './login.html'; // Chuyển về trang login
            }
        });
    }

    // 2.2. Chạy các hàm tải dữ liệu
    checkUserSession();
    loadDashboardStats();
});

// 3. HÀM BẢO VỆ TRANG & LẤY TÊN NGƯỜI DÙNG
async function checkUserSession() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        // Nếu KHÔNG có session -> Đá về trang login
        window.location.href = './login.html';
        return; 
    }

    // Nếu CÓ session -> Lấy thông tin profile
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', session.user.id) // Tìm profile có ID khớp với ID user
        .single();

    // Lấy các element bên trong hàm này (an toàn)
    const userGreetingEl = document.getElementById('user-greeting');
    const userAvatarEl = document.getElementById('user-avatar');
    if (!userGreetingEl) return; // Thoát nếu không tìm thấy

    if (error) {
        console.error('Lỗi khi lấy profile:', error);
        userGreetingEl.textContent = `Chào, ${session.user.email}`;
    } else if (profile) {
        // TÌM THẤY PROFILE (THÀNH CÔNG)
        userGreetingEl.textContent = `Chào, ${profile.full_name}`;
        if (userAvatarEl && profile.avatar_url) {
            userAvatarEl.src = profile.avatar_url;
        }
    } else {
        // KHÔNG LỖI, NHƯNG KHÔNG TÌM THẤY PROFILE (data: null)
        console.warn('Không tìm thấy profile cho user ID:', session.user.id);
        userGreetingEl.textContent = `Chào, ${session.user.email} (Chưa tạo hồ sơ)`;
    }
}

// 4. HÀM TẢI CÁC SỐ LIỆU THỐNG KÊ
async function loadDashboardStats() {
    // Lấy các element bên trong hàm này (an toàn)
    const totalMembersEl = document.getElementById('total-members');
    const upcomingEventsEl = document.getElementById('upcoming-events');
    const pendingTasksEl = document.getElementById('pending-tasks');

    // 1. Đếm tổng số thành viên
    const { count: membersCount, error: membersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
    
    // 2. Đếm sự kiện sắp diễn ra
    const today = new Date().toISOString();
    const { count: eventsCount, error: eventsError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .gt('event_date', today); // Lớn hơn hôm nay

    // 3. Đếm task chưa hoàn thành
    const { count: tasksCount, error: tasksError } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'Hoàn thành'); // Không bằng 'Hoàn thành'
        
    // Cập nhật lên HTML
    if (totalMembersEl) totalMembersEl.textContent = membersError ? 'Lỗi' : (membersCount ?? 0);
    if (upcomingEventsEl) upcomingEventsEl.textContent = eventsError ? 'Lỗi' : (eventsCount ?? 0);
    if (pendingTasksEl) pendingTasksEl.textContent = tasksError ? 'Lỗi' : (tasksCount ?? 0);
}