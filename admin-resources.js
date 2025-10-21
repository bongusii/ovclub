// admin-resources.js

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
    checkUserSession(); // Sẽ gọi loadResources và renderUI sau
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
    console.log("Resource page role:", currentUserRole);

    renderUIBasedOnRole();
    loadResources();
}

// 4. RENDER UI THEO ROLE
function renderUIBasedOnRole() {
    // Ẩn nút "+ Tải lên" nếu không phải Admin/Trưởng mảng
    const addResourceButton = document.querySelector('header a[href="./admin-resource-new.html"]');
    if (addResourceButton) {
        if (currentUserRole !== 'chu_nhiem' && currentUserRole !== 'pho_chu_nhiem' &&
            currentUserRole !== 'truong_mang_sk' && currentUserRole !== 'truong_mang_tt') {
            addResourceButton.style.display = 'none';
        } else {
            addResourceButton.style.display = 'inline-block'; // Hoặc block
        }
    }
}

// 5. TẢI DỮ LIỆU TÀI LIỆU (RESOURCES)
async function loadResources() {
    const tableBody = document.getElementById('resources-table-body');
    if (!tableBody) return;

    // JOIN với profiles
    const { data: resources, error } = await supabase
        .from('resources')
        .select(`id, title, category, file_url, created_at, profiles ( full_name )`)
        .order('created_at', { ascending: false });

    if (error) { /* ... Xử lý lỗi ... */ return; }
    if (resources.length === 0) { /* ... Thông báo chưa có resource ... */ return; }

    tableBody.innerHTML = ''; // Xóa dòng mẫu

    resources.forEach(resource => {
        const row = document.createElement('tr');
        const uploaderName = resource.profiles ? resource.profiles.full_name : 'N/A';
        const uploadDate = new Date(resource.created_at).toLocaleDateString('vi-VN');
        const categoryBadge = formatCategory(resource.category);
        const filePathInStorage = resource.file_url ? resource.file_url.substring(resource.file_url.indexOf('/resources/') + '/resources/'.length) : null;

        // Tạo chuỗi HTML cho hành động
        let actionsHtml = `<a href="${resource.file_url}" target="_blank" class="text-indigo-600 hover:text-indigo-900 mr-3">Tải về</a>`;
        // Chỉ Admin/Trưởng mảng mới thấy Sửa/Xóa
        if (currentUserRole === 'chu_nhiem' || currentUserRole === 'pho_chu_nhiem' ||
            currentUserRole === 'truong_mang_sk' || currentUserRole === 'truong_mang_tt') {
            actionsHtml += `<a href="./admin-resource-edit.html?id=${resource.id}" class="text-indigo-600 hover:text-indigo-900 mr-3">Sửa</a>`;
            actionsHtml += `<button data-resource-id="${resource.id}" data-resource-title="${resource.title}" data-file-path="${filePathInStorage || ''}" class="text-red-600 hover:text-red-900 delete-resource-button" ${!filePathInStorage ? 'disabled' : ''}>Xóa</button>`;
        }

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm font-medium text-gray-900">${resource.title}</div></td>
            <td class="px-6 py-4 whitespace-nowrap">${categoryBadge}</td>
            <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm text-gray-900">${uploaderName}</div></td>
            <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm text-gray-900">${uploadDate}</div></td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">${actionsHtml}</td>
        `;
        tableBody.appendChild(row);
    });

    // Gắn sự kiện cho các nút Xóa (nếu có)
    const deleteButtons = tableBody.querySelectorAll('.delete-resource-button');
    deleteButtons.forEach(button => {
        button.addEventListener('click', handleDeleteResourceClick);
    });
}

// 6. HÀM XỬ LÝ CLICK NÚT XÓA RESOURCE
async function handleDeleteResourceClick(event) {
    const button = event.target;
    const resourceId = button.dataset.resourceId;
    const resourceTitle = button.dataset.resourceTitle;
    const filePath = button.dataset.filePath;

    if (!filePath) { /* ... Báo lỗi không có path ... */ return; }

    const isConfirmed = window.confirm(`Bạn có chắc chắn muốn xóa tài liệu "${resourceTitle}" không? File sẽ bị xóa vĩnh viễn.`);

    if (isConfirmed) {
        button.disabled = true; button.textContent = 'Đang xóa...';
        try {
            // Xóa file khỏi Storage
            const { error: storageError } = await supabase.storage.from('resources').remove([filePath]);
            if (storageError) console.warn('Lỗi xóa file Storage:', storageError);

            // Xóa bản ghi khỏi Database
            const { error: dbError } = await supabase.from('resources').delete().eq('id', resourceId);
            if (dbError) throw dbError;

            alert(`Đã xóa thành công tài liệu "${resourceTitle}".`);
            loadResources(); // Cập nhật lại bảng
        } catch (error) {
            console.error('Lỗi xóa tài liệu:', error);
            alert(`Lỗi xóa tài liệu: ${error.message}`);
            button.disabled = false; button.textContent = 'Xóa';
        }
    } else { /* ... Hủy xóa ... */ }
}

// 7. HÀM HỖ TRỢ: Định dạng phân loại tài liệu
function formatCategory(category) {
    // ... (Giữ nguyên switch case) ...
    switch (category) {
        case 'Chung': return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Chung</span>`;
        case 'Sự kiện': return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Sự kiện</span>`;
        case 'Truyền thông': return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Truyền thông</span>`;
        default: return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">${category || 'N/A'}</span>`;
    }
}