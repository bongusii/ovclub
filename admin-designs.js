// admin-designs.js

// 1. KẾT NỐI SUPABASE
const SUPABASE_URL = 'https://gzvyvujgpuexdaubqrmy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dnl2dWpncHVleGRhdWJxcm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDg0MDUsImV4cCI6MjA3NjM4NDQwNX0.9QaC0I26YP2uiZeTuVB-GK3yQR2jwjq6FnNLQKLNrMw';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Biến toàn cục để lưu vai trò
let currentUserRole = null;

// 2. HÀM CHẠY SAU KHI HTML TẢI XONG
document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logout-button');
    if(logoutButton) {
        logoutButton.addEventListener('click', async () => { /* ... (code đăng xuất) ... */ });
    }
    checkUserSession(); // Sẽ gọi loadDesignRequests và renderUI sau
});

// 3. BẢO VỆ TRANG & LẤY ROLE
async function checkUserSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { /* ... đá về login ... */ window.location.href = './login.html'; return; }

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

    if (error || !profile) currentUserRole = null;
    else currentUserRole = profile.role;
    console.log("Design page role:", currentUserRole);

    renderUIBasedOnRole();
    loadDesignRequests();
}

// 4. RENDER UI THEO ROLE (Nút Thêm luôn hiện)
function renderUIBasedOnRole() {
    // Nút "+ Tạo yêu cầu mới" luôn hiển thị cho mọi người dùng đã đăng nhập
    // nên không cần logic ẩn ở đây.
    // Nếu muốn ẩn cả menu item thì logic sẽ giống dashboard.js
}

// 5. TẢI DỮ LIỆU YÊU CẦU THIẾT KẾ
async function loadDesignRequests() {
    const tableBody = document.getElementById('designs-table-body');
    if (!tableBody) return;

    // JOIN 2 lần vào profiles
    const { data: requests, error } = await supabase
        .from('design_requests')
        .select(`id, title, created_at, status, requester_profile:profiles!requester_id ( full_name ), assignee_profile:profiles!assignee_id ( full_name )`)
        .order('created_at', { ascending: false });

    if (error) { /* ... Xử lý lỗi ... */ return; }
    if (requests.length === 0) { /* ... Thông báo chưa có request ... */ return; }

    tableBody.innerHTML = ''; // Xóa dòng mẫu

    requests.forEach(request => {
        const row = document.createElement('tr');
        const requesterName = request.requester_profile ? request.requester_profile.full_name : 'N/A';
        const assigneeName = request.assignee_profile ? request.assignee_profile.full_name : 'Chưa gán';
        const createdDate = new Date(request.created_at).toLocaleDateString('vi-VN');
        const statusBadge = formatDesignStatus(request.status);

        // Tạo chuỗi HTML cho hành động
        let actionsHtml = '';
        // Admin HOẶC thành viên mảng TT thấy nút Sửa
        if (currentUserRole === 'chu_nhiem' || currentUserRole === 'pho_chu_nhiem' ||
            currentUserRole === 'truong_mang_tt' || currentUserRole === 'thanh_vien_tt') {
            actionsHtml += `<a href="./admin-design-edit.html?id=${request.id}" class="text-indigo-600 hover:text-indigo-900 mr-3">Sửa</a>`;
        }
        // Chỉ Admin HOẶC Trưởng mảng TT thấy nút Xóa
        if (currentUserRole === 'chu_nhiem' || currentUserRole === 'pho_chu_nhiem' ||
            currentUserRole === 'truong_mang_tt') {
             actionsHtml += `<button data-request-id="${request.id}" data-request-title="${request.title}" class="text-red-600 hover:text-red-900 delete-design-button">Xóa</button>`;
        }
        // Nếu không có quyền nào thì hiển thị gì đó hoặc để trống
        if (actionsHtml === '') {
             actionsHtml = `<span class="text-gray-400">Không có quyền</span>`;
        }

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm font-medium text-gray-900">${request.title}</div></td>
            <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm text-gray-900">${requesterName}</div></td>
            <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm text-gray-500">${assigneeName}</div></td>
            <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm text-gray-900">${createdDate}</div></td>
            <td class="px-6 py-4 whitespace-nowrap">${statusBadge}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">${actionsHtml}</td>
        `;
        tableBody.appendChild(row);
    });

     // Gắn sự kiện cho các nút Xóa (nếu có)
    const deleteButtons = tableBody.querySelectorAll('.delete-design-button');
    deleteButtons.forEach(button => {
        button.addEventListener('click', handleDeleteDesignClick);
    });
}

// 6. HÀM XỬ LÝ CLICK NÚT XÓA YÊU CẦU
async function handleDeleteDesignClick(event) {
    const button = event.target;
    const requestId = button.dataset.requestId;
    const requestTitle = button.dataset.requestTitle;

    const isConfirmed = window.confirm(`Bạn có chắc chắn muốn xóa yêu cầu "${requestTitle}" không?`);

    if (isConfirmed) {
        console.log(`Đang xóa yêu cầu ID: ${requestId}`);
        try {
            const { error } = await supabase
                .from('design_requests')
                .delete()
                .eq('id', requestId);

            if (error) throw error;
            alert(`Đã xóa thành công yêu cầu "${requestTitle}".`);
            loadDesignRequests(); // Cập nhật lại bảng
        } catch (error) {
            console.error('Lỗi khi xóa yêu cầu:', error);
            alert(`Lỗi khi xóa yêu cầu: ${error.message}`);
        }
    } else { /* ... Hủy xóa ... */ }
}

// 7. HÀM HỖ TRỢ: Định dạng trạng thái yêu cầu thiết kế
function formatDesignStatus(status) {
    // ... (Giữ nguyên switch case) ...
    switch (status) {
        case 'Mới': return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Mới</span>`;
        case 'Đang thiết kế': return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Đang thiết kế</span>`;
        case 'Chờ duyệt': return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">Chờ duyệt</span>`;
        case 'Hoàn thành': return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Hoàn thành</span>`;
        default: return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">${status || 'N/A'}</span>`;
    }
}