// dashboard.js

// 1. KẾT NỐI SUPABASE (Dùng URL và Key của bạn)
const SUPABASE_URL = 'https://gzvyvujgpuexdaubqrmy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIJ1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dnl2dWpncHVleGRhdWJxcm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDg0MDUsImV4cCI6MjA3NjM4NDQwNX0.9QaC0I26YP2uiZeTuVB-GK3yQR2jwjq6FnNLQKLNrMw';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. LẤY CÁC THÀNH TỐ HTML
const userGreetingEl = document.getElementById('user-greeting');
const userAvatarEl = document.getElementById('user-avatar');
const logoutButton = document.getElementById('logout-button');

// Lấy các ô thống kê
const totalMembersEl = document.getElementById('total-members');
const upcomingEventsEl = document.getElementById('upcoming-events');
const pendingTasksEl = document.getElementById('pending-tasks');

// 3. HÀM CHẠY NGAY KHI TẢI TRANG
document.addEventListener('DOMContentLoaded', () => {
    checkUserSession();
    loadDashboardStats();
});

// 4. BẢO VỆ TRANG & LẤY THÔNG TIN NGƯỜI DÙNG
async function checkUserSession() {
    // Lấy phiên đăng nhập (session) hiện tại
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        // Nếu KHÔNG có session (chưa đăng nhập) -> Đá về trang login
        window.location.href = './login.html';
    } else {
        // Nếu CÓ session (đã đăng nhập)
        console.log('Người dùng đã đăng nhập:', session.user.email);
        
        // Lấy thông tin chi tiết (full_name, role) từ bảng 'profiles'
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('full_name, avatar_url') // Chỉ lấy tên và avatar
            .eq('id', session.user.id) // Tìm profile có ID khớp với ID user
            .single(); // Lấy 1 kết quả duy nhất

        if (error) {
            console.error('Lỗi khi lấy profile:', error);
            userGreetingEl.textContent = `Chào, ${session.user.email}`;
        } else if (profile) {
            // Hiển thị lời chào
            userGreetingEl.textContent = `Chào, ${profile.full_name}`;
            
            // (Nâng cao) Cập nhật avatar nếu có
            if (profile.avatar_url) {
                userAvatarEl.src = profile.avatar_url;
            }
        }
    }
}

// 5. TẢI CÁC SỐ LIỆU THỐNG KÊ
async function loadDashboardStats() {
    // (Đây là code ví dụ, chúng ta sẽ làm chi tiết sau)
    
    // Đếm tổng số thành viên
    const { count: membersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
    
    // Đếm sự kiện sắp diễn ra (có ngày event_date > hôm nay)
    const today = new Date().toISOString();
    const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .gt('event_date', today); // gt = greater than

    // Đếm task chưa hoàn thành
    const { count: tasksCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'Hoàn thành'); // neq = not equal
        
    // Cập nhật lên HTML
    totalMembersEl.textContent = membersCount ?? 0;
    upcomingEventsEl.textContent = eventsCount ?? 0;
    pendingTasksEl.textContent = tasksCount ?? 0;
}

// 6. XỬ LÝ ĐĂNG XUẤT
logoutButton.addEventListener('click', async () => {
    // Gọi hàm signOut của Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) {
        console.error('Lỗi khi đăng xuất:', error);
    } else {
        // Đăng xuất thành công, chuyển về trang login
        window.location.href = './login.html';
    }
});