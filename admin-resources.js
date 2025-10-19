// admin-resources.js

// 1. KẾT NỐI SUPABASE
const SUPABASE_URL = 'https://gzvyvujgpuexdaubqrmy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dnl2dWpncHVleGRhdWJxcm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDg0MDUsImV4cCI6MjA3NjM4NDQwNX0.9QaC0I26YP2uiZeTuVB-GK3yQR2jwjq6FnNLQKLNrMw';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. HÀM CHẠY SAU KHI HTML ĐÃ TẢI XONG
document.addEventListener('DOMContentLoaded', () => {
    // Lấy các thành tố HTML
    const logoutButton = document.getElementById('logout-button');
    
    // Gắn sự kiện Đăng xuất
    if(logoutButton) {
        logoutButton.addEventListener('click', async () => {
            const { error } = await supabase.auth.signOut();
            if (!error) {
                window.location.href = './login.html';
            } else {
                console.error('Lỗi khi đăng xuất:', error);
            }
        });
    }

    // Chạy các hàm khởi tạo
    checkUserSession(); // Bảo vệ trang
    loadResources(); // Tải dữ liệu tài liệu
});

// 3. BẢO VỆ TRANG
async function checkUserSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        // Nếu chưa đăng nhập, đá về trang login
        window.location.href = './login.html';
    }
}

// 4. TẢI DỮ LIỆU TÀI LIỆU (RESOURCES)
async function loadResources() {
    const tableBody = document.getElementById('resources-table-body');
    if (!tableBody) return;

    // Lấy tất cả cột từ 'resources'
    // Lấy cột 'full_name' từ bảng 'profiles' (liên kết qua 'uploader_id')
    const { data: resources, error } = await supabase
        .from('resources')
        .select(`
            id,
            title,
            category,
            file_url,
            created_at,
            profiles ( full_name )
        `)
        .order('created_at', { ascending: false }); // Mới nhất lên đầu

    if (error) {
        console.error('Lỗi khi tải danh sách tài liệu:', error);
        tableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-center text-red-500">Không thể tải dữ liệu tài liệu.</td></tr>`;
        return;
    }

    // Nếu không có tài liệu nào
    if (resources.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">Chưa có tài liệu nào được tải lên.</td></tr>`;
        return;
    }

    // Xóa dòng "Đang tải..." mẫu
    tableBody.innerHTML = '';

    // Lặp qua từng tài liệu và tạo hàng (row) mới
    resources.forEach(resource => {
        const row = document.createElement('tr');
        
        // Lấy dữ liệu JOIN một cách an toàn
        // resource.profiles là một object { full_name: '...' }
        const uploaderName = resource.profiles ? resource.profiles.full_name : 'N/A';
        
        // Định dạng ngày (dd/mm/yyyy)
        const uploadDate = new Date(resource.created_at).toLocaleDateString('vi-VN');
            
        // Định dạng phân loại (category)
        const categoryBadge = formatCategory(resource.category);

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${resource.title}</div>
            </td>
            
            <td class="px-6 py-4 whitespace-nowrap">
                ${categoryBadge}
            </td>
            
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${uploaderName}</div>
            </td>

            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${uploadDate}</div>
            </td>
            
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <a href="${resource.file_url}" target="_blank" class="text-indigo-600 hover:text-indigo-900">Tải về</a>
                </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// 5. HÀM HỖ TRỢ: Định dạng phân loại tài liệu
function formatCategory(category) {
    switch (category) {
        case 'Chung':
            return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Chung</span>`;
        case 'Sự kiện':
            return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Sự kiện</span>`;
        case 'Truyền thông':
            return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Truyền thông</span>`;
        default:
            return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">${category || 'N/A'}</span>`;
    }
}