// dashboard.js

// 1. KẾT NỐI SUPABASE
const SUPABASE_URL = 'https://gzvyvujgpuexdaubqrmy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dnl2dWpncHVleGRhdWJxcm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDg0MDUsImV4cCI6MjA3NjM4NDQwNX0.9QaC0I26YP2uiZeTuVB-GK3yQR2jwjq6FnNLQKLNrMw';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. HÀM CHẠY SAU KHI HTML ĐÃ TẢI XONG
document.addEventListener('DOMContentLoaded', () => {
    // --- BỌC TẤT CẢ LOGIC THỰC THI VÀO ĐÂY ---

    // 2.1. Lấy các thành tố HTML (Bây giờ đã an toàn)
    const logoutButton = document.getElementById('logout-button');

    // 2.2. Gắn sự kiện Đăng xuất (Bây giờ đã an toàn)
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            const { error } = await supabase.auth.signOut();
            
            if (error) {
                console.error('Lỗi khi đăng xuất:', error);
            } else {
                // Đăng xuất thành công, chuyển về trang login
                window.location.href = './login.html';
            }
        });
    }

    // 2.3. Chạy các hàm khởi tạo
    checkUserSession();
    loadDashboardStats();
});

// 3. BẢO VỆ TRANG & LẤY THÔNG TIN NGƯỜI DÙNG (Định nghĩa hàm)
async function checkUserSession() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        window.location.href = './login.html';
        return; 
    }

    console.log('Người dùng đã đăng nhập:', session.user.email);
    
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', session.user.id)
        .single();

    // Lấy lại element (vì hàm này chạy bất đồng bộ)
    const userGreetingEl = document.getElementById('user-greeting');
    const userAvatarEl = document.getElementById('user-avatar');

    if (error) {
        console.error('Lỗi khi lấy profile:', error);
        if(userGreetingEl) userGreetingEl.textContent = `Chào, ${session.user.email}`;
    } else if (profile) {
        // TÌM THẤY PROFILE (THÀNH CÔNG)
        if(userGreetingEl) userGreetingEl.textContent = `Chào, ${profile.full_name}`;
        if(userAvatarEl && profile.avatar_url) {
            userAvatarEl.src = profile.avatar_url;
        }
    } else {
        // KHÔNG LỖI, NHƯNG KHÔNG TÌM THẤY PROFILE
        console.warn('Không tìm thấy profile cho user ID:', session.user.id);
        if(userGreetingEl) userGreetingEl.textContent = `Chào, ${session.user.email} (Chưa tạo hồ sơ)`;
    }
}

// 4. TẢI CÁC SỐ LIỆU THỐNG KÊ (Định nghĩa hàm)
async function loadDashboardStats() {
    // Lấy các element bên trong hàm này để đảm bảo chúng tồn tại
    const totalMembersEl = document.getElementById('total-members');
    const upcomingEventsEl = document.getElementById('upcoming-events');
    const pendingTasksEl = document.getElementById('pending-tasks');
    
    // Đếm tổng số thành viên
    const { count: membersCount, error: membersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
    
    // Đếm sự kiện sắp diễn ra
    const today = new Date().toISOString();
    const { count: eventsCount, error: eventsError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .gt('event_date', today);

    // Đếm task chưa hoàn thành
    const { count: tasksCount, error: tasksError } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'Hoàn thành');
        
    // Cập nhật lên HTML (có kiểm tra null)
    if (totalMembersEl) totalMembersEl.textContent = membersError ? 'Lỗi' : (membersCount ?? 0);
    if (upcomingEventsEl) upcomingEventsEl.textContent = eventsError ? 'Lỗi' : (eventsCount ?? 0);
    if (pendingTasksEl) pendingTasksEl.textContent = tasksError ? 'Lỗi' : (tasksCount ?? 0);
}