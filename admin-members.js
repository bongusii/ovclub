// admin-members.js

// 1. KẾT NỐI SUPABASE
const SUPABASE_URL = 'https://gzvyvujgpuexdaubqrmy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dnl2dWpncHVleGRhdWJxcm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDg0MDUsImV4cCI6MjA3NjM4NDQwNX0.9QaC0I26YP2uiZeTuVB-GK3yQR2jwjq6FnNLQKLNrMw';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. HÀM CHẠY SAU KHI HTML ĐÃ TẢI XONG
document.addEventListener('DOMContentLoaded', () => {
    // Lấy các thành tố HTML
    const logoutButton = document.getElementById('logout-button');
    const membersTableBody = document.getElementById('members-table-body');

    // Gắn sự kiện Đăng xuất
    logoutButton.addEventListener('click', async () => {
        const { error } = await supabase.auth.signOut();
        if (!error) {
            window.location.href = './login.html';
        } else {
            console.error('Lỗi khi đăng xuất:', error);
        }
    });

    // Chạy các hàm khởi tạo
    checkUserSession(); // Bảo vệ trang
    loadMembers(); // Tải dữ liệu
});

// 3. BẢO VỆ TRANG
async function checkUserSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        // Nếu chưa đăng nhập, đá về trang login
        window.location.href = './login.html';
    }
}

// 4. TẢI DỮ LIỆU THÀNH VIÊN
async function loadMembers() {
    const tableBody = document.getElementById('members-table-body');
    if (!tableBody) return;

    // Lấy tất cả dữ liệu từ bảng 'profiles'
    // Sắp xếp theo 'full_name' để có thứ tự A-Z
    const { data: members, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

    if (error) {
        console.error('Lỗi khi tải danh sách thành viên:', error);
        tableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-center text-red-500">Không thể tải dữ liệu.</td></tr>`;
        return;
    }

    // Nếu không có thành viên nào
    if (members.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">Chưa có thành viên nào.</td></tr>`;
        return;
    }

    // Xóa dòng "Đang tải..." mẫu
    tableBody.innerHTML = '';

    // Lặp qua từng thành viên và tạo hàng (row) mới
    members.forEach(member => {
        const row = document.createElement('tr');
        
        // Định dạng vai trò (role) cho dễ đọc
        const roleText = formatRole(member.role);
        
        // Định dạng trạng thái (status)
        const statusBadge = member.is_active
            ? `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Đang hoạt động</span>`
            : `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Cựu thành viên</span>`;

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                        <img class="h-10 w-10 rounded-full" 
                             src="${member.avatar_url || 'https://via.placeholder.com/40'}" 
                             alt="Avatar">
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${member.full_name || 'Chưa cập nhật'}</div>
                    </div>
                </div>
            </td>
            
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${roleText}</div>
            </td>
            
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${member.mem_id || 'N/A'}</div>
            </td>
            
            <td class="px-6 py-4 whitespace-nowrap">
                ${statusBadge}
            </td>
            
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <a href="#" class="text-indigo-600 hover:text-indigo-900">Sửa</a>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// 5. HÀM HỖ TRỢ: Định dạng vai trò cho dễ đọc
function formatRole(roleKey) {
    const roles = {
        'chu_nhiem': 'Chủ nhiệm',
        'pho_chu_nhiem': 'Phó Chủ nhiệm',
        'truong_mang_sk': 'Trưởng mảng Sự kiện',
        'truong_mang_tt': 'Trưởng mảng Truyền thông',
        'thanh_vien_sk': 'TV Sự kiện',
        'thanh_vien_tt': 'TV Truyền thông'
    };
    return roles[roleKey] || (roleKey ? roleKey.replace('_', ' ') : 'Chưa phân');
}