// admin-members.js

// 1. KẾT NỐI SUPABASE
const SUPABASE_URL = 'https://gzvyvujgpuexdaubqrmy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dnl2dWpncHVleGRhdWJxcm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDg0MDUsImV4cCI6MjA3NjM4NDQwNX0.9QaC0I26YP2uiZeTuVB-GK3yQR2jwjq6FnNLQKLNrMw';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Biến toàn cục để lưu vai trò
let currentUserRole = null;

// 2. HÀM CHẠY SAU KHI HTML ĐÃ TẢI XONG
document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logout-button');
    if(logoutButton) {
        logoutButton.addEventListener('click', async () => {
            const { error } = await supabase.auth.signOut();
            if (!error) window.location.href = './login.html';
            else console.error('Lỗi đăng xuất:', error);
        });
    }
    checkUserSession(); // Sẽ gọi loadMembers và renderUI sau
});

// 3. BẢO VỆ TRANG & LẤY ROLE
async function checkUserSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = './login.html';
        return;
    }

    // Lấy role
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

    if (error || !profile) {
        currentUserRole = null;
        console.error("Lỗi lấy profile:", error);
    } else {
        currentUserRole = profile.role;
        console.log("Member page role:", currentUserRole);
    }
    // Gọi render và load sau khi có (hoặc không có) role
    renderUIBasedOnRole();
    loadMembers();
}

// 4. RENDER UI THEO ROLE
function renderUIBasedOnRole() {
    // Ẩn nút "+ Thêm thành viên" nếu không phải Admin/Phó CN
    const addMemberButton = document.querySelector('header a[href="./admin-member-new.html"]');
    if (addMemberButton) {
        if (currentUserRole !== 'chu_nhiem' && currentUserRole !== 'pho_chu_nhiem') {
            console.log("Hiding Add Member button"); // Log để kiểm tra
            addMemberButton.style.display = 'none';
        } else {
            console.log("Showing Add Member button"); // Log để kiểm tra
            addMemberButton.style.display = 'inline-block'; // Hoặc block
        }
    } else {
         console.warn("Could not find Add Member button");
    }
}

// 5. TẢI DỮ LIỆU THÀNH VIÊN
async function loadMembers() {
    const tableBody = document.getElementById('members-table-body');
    if (!tableBody) return;

    const { data: members, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

    if (error) {
        console.error('Lỗi khi tải danh sách thành viên:', error);
        tableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-center text-red-500">Không thể tải dữ liệu.</td></tr>`;
        return;
     }
    if (members.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">Chưa có thành viên nào.</td></tr>`;
        return;
     }

    tableBody.innerHTML = ''; // Xóa dòng mẫu

    members.forEach(member => {
        const row = document.createElement('tr');
        const roleDisplay = formatRole(member.role);
        // Logic tạo statusBadge
        const isActiveText = member.is_active ? 'Đang hoạt động' : 'Cựu thành viên';
        const statusColor = member.is_active ? 'green' : 'red';
        const statusBadgeHtml = `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${statusColor}-100 text-${statusColor}-800">${isActiveText}</span>`;

        // Tạo chuỗi HTML cho hành động
        let actionsHtml = '';
        // *** CHỈ ADMIN MỚI THẤY NÚT SỬA ***
        if (currentUserRole === 'chu_nhiem' || currentUserRole === 'pho_chu_nhiem') {
            actionsHtml += `<a href="./admin-member-edit.html?id=${member.id}" class="text-indigo-600 hover:text-indigo-900 mr-3">Sửa</a>`;
            actionsHtml += `<button data-member-id="${member.id}" data-member-name="${member.full_name || 'Chưa có tên'}" class="text-red-600 hover:text-red-900 delete-member-button">Xóa</button>`;
        } else {
            // Người dùng thường chỉ thấy nút xem (hoặc không thấy gì cả)
            actionsHtml = `<span class="text-gray-400">Không có quyền sửa/xóa</span>`; // Hoặc để trống ''
        }
        // *** HẾT PHẦN SỬA ***

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10"><img class="h-10 w-10 rounded-full" src="${member.avatar_url || 'https://via.placeholder.com/40'}" alt="Avatar"></div>
                    <div class="ml-4"><div class="text-sm font-medium text-gray-900">${member.full_name || 'Chưa cập nhật'}</div></div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">${roleDisplay}</td>
            <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm text-gray-900">${member.mem_id || 'N/A'}</div></td>
            <td class="px-6 py-4 whitespace-nowrap">${statusBadgeHtml}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">${actionsHtml}</td>
        `;
        tableBody.appendChild(row);
    });

    // Gắn sự kiện cho các nút Xóa (nếu có)
    const deleteButtons = tableBody.querySelectorAll('.delete-member-button');
    deleteButtons.forEach(button => {
        button.addEventListener('click', handleDeleteMemberClick);
    });
}

// 6. HÀM XỬ LÝ CLICK NÚT XÓA THÀNH VIÊN
async function handleDeleteMemberClick(event) {
    const button = event.target;
    const memberId = button.dataset.memberId;
    const memberName = button.dataset.memberName;

    const isConfirmed = window.confirm(`Bạn có chắc chắn muốn xóa hồ sơ của thành viên "${memberName}" không?\n\nHành động này chỉ xóa thông tin hồ sơ, không xóa tài khoản đăng nhập.`);

    if (isConfirmed) {
        console.log(`Đang xóa hồ sơ thành viên ID: ${memberId}`);
        try {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', memberId);

            if (error) throw error;
            alert(`Đã xóa thành công hồ sơ của "${memberName}".`);
            loadMembers(); // Cập nhật lại bảng
        } catch (error) {
            console.error('Lỗi khi xóa hồ sơ:', error);
            alert(`Lỗi khi xóa hồ sơ: ${error.message}`);
        }
    } else {
        console.log('Hủy xóa hồ sơ.');
    }
}

// 7. HÀM HỖ TRỢ: Tạo thẻ IMG cho huy hiệu vai trò
function formatRole(roleKey) {
    const badgeMap = {
        'chu_nhiem': 'chu_nhiem',
        'pho_chu_nhiem': 'pho_chu_nhiem',
        'truong_mang_sk': 'truong_mang_sk',
        'truong_mang_tt': 'truong_mang_tt',
        'thanh_vien_sk': 'thanh_vien_sk',
        'thanh_vien_tt': 'thanh_vien_tt'
    };
    const badgeFileNameBase = badgeMap[roleKey];

    if (badgeFileNameBase) {
        // *** Đảm bảo đuôi file .png đúng với file của bạn ***
        const badgeSrc = `./images/badges/${badgeFileNameBase}.svg`;
        return `<img src="${badgeSrc}" alt="${roleKey}" title="${getRoleTooltip(roleKey)}" class="h-6 w-auto inline-block">`;
    } else {
        return roleKey ? roleKey.replace('_', ' ') : 'Chưa phân';
    }
}

// 8. HÀM PHỤ TRỢ: Lấy tooltip chữ cho huy hiệu
function getRoleTooltip(roleKey) {
    const roles = {
        'chu_nhiem': 'Chủ nhiệm',
        'pho_chu_nhiem': 'Phó Chủ nhiệm',
        'truong_mang_sk': 'Trưởng mảng Sự kiện',
        'truong_mang_tt': 'Trưởng mảng Truyền thông',
        'thanh_vien_sk': 'Thành viên Sự kiện',
        'thanh_vien_tt': 'Thành viên Truyền thông'
    };
    return roles[roleKey] || roleKey;
}