// dashboard.js

// 1. KẾT NỐI SUPABASE
const SUPABASE_URL = 'https://gzvyvujgpuexdaubqrmy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dnl2dWpncHVleGRhdWJxcm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDg0MDUsImV4cCI6MjA3NjM4NDQwNX0.9QaC0I26YP2uiZeTuVB-GK3yQR2jwjq6FnNLQKLNrMw';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Biến toàn cục để lưu vai trò người dùng hiện tại
let currentUserRole = null;

// 2. HÀM CHẠY SAU KHI HTML TẢI XONG
document.addEventListener('DOMContentLoaded', () => {
    // Lấy nút Đăng xuất và gán sự kiện
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

    // Chạy các hàm khởi tạo
    checkUserSession(); // Sẽ gọi renderUIBasedOnRole và loadDashboardStats sau khi có role
});

// 3. HÀM BẢO VỆ TRANG & LẤY TÊN/VAI TRÒ NGƯỜI DÙNG
async function checkUserSession() {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (!session) {
        // Nếu KHÔNG có session -> Đá về trang login
        window.location.href = './login.html';
        return;
    }

    // Lấy thông tin profile, *bao gồm cả role*
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, role') // LẤY THÊM ROLE
        .eq('id', session.user.id)
        .single();

    const userGreetingEl = document.getElementById('user-greeting');
    const userAvatarEl = document.getElementById('user-avatar');

    if (profileError || !profile) {
        console.error('Lỗi khi lấy profile hoặc profile không tồn tại:', profileError);
        currentUserRole = null; // Gán role mặc định nếu lỗi
        if(userGreetingEl) userGreetingEl.textContent = `Chào, ${session.user.email} (Lỗi hồ sơ)`;
        // Vẫn gọi render UI để ẩn các mục không được phép
        renderUIBasedOnRole();
        // Có thể gọi loadDashboardStats ở đây nếu muốn hiển thị số liệu dù lỗi profile
        // loadDashboardStats();
        return; // Dừng lại nếu không có profile
    }

    // Lưu vai trò vào biến toàn cục
    currentUserRole = profile.role;
    console.log('Vai trò người dùng:', currentUserRole);

    // Hiển thị lời chào
    if(userGreetingEl) userGreetingEl.textContent = `Chào, ${profile.full_name}`;
    if(userAvatarEl && profile.avatar_url) {
        userAvatarEl.src = profile.avatar_url;
    }

    // Gọi hàm render UI và tải số liệu sau khi đã có role
    renderUIBasedOnRole();
    loadDashboardStats();
}

// 4. HÀM ẨN/HIỆN CÁC THÀNH PHẦN DỰA TRÊN VAI TRÒ
function renderUIBasedOnRole() {
    console.log("Rendering UI based on role:", currentUserRole); // Thêm log để kiểm tra

    // Ẩn menu "Yêu cầu Thiết kế" nếu không phải Admin/Phó CN hoặc thuộc mảng TT
    const designMenuItem = document.querySelector('a[href="./admin-designs.html"]');
    if (designMenuItem) {
        if (currentUserRole !== 'chu_nhiem' && currentUserRole !== 'pho_chu_nhiem' &&
            currentUserRole !== 'truong_mang_tt' && currentUserRole !== 'thanh_vien_tt') {
            console.log("Hiding Design Menu Item"); // Thêm log
            designMenuItem.style.display = 'none'; // Ẩn đi
        } else {
            console.log("Showing Design Menu Item"); // Thêm log
            designMenuItem.style.display = 'flex'; // Hiện ra (đảm bảo nó hiện nếu trước đó bị ẩn)
        }
    } else {
        console.warn("Could not find Design Menu item to toggle visibility"); // Cảnh báo nếu không tìm thấy
    }

    // TODO: Thêm logic ẩn/hiện các nút "Thêm", "Sửa", "Xóa" ở các trang khác TẠI ĐÂY
    // Ví dụ: Ẩn nút "+ Thêm thành viên" nếu không phải Admin/Phó CN
    // (Lưu ý: Nút này không có trên dashboard.html nên selector này sẽ không tìm thấy gì ở đây)
    const addMemberButton = document.querySelector('header a[href="./admin-member-new.html"]');
     if (addMemberButton) { // Chỉ chạy nếu tìm thấy nút (tức là đang ở trang admin-members.html)
        if (currentUserRole !== 'chu_nhiem' && currentUserRole !== 'pho_chu_nhiem') {
             addMemberButton.style.display = 'none';
        } else {
             addMemberButton.style.display = 'inline-block'; // Hoặc 'block' tùy layout
        }
     }
}


// 5. HÀM TẢI CÁC SỐ LIỆU THỐNG KÊ
async function loadDashboardStats() {
    // Lấy các element bên trong hàm này (an toàn hơn)
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