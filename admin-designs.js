// admin-designs.js

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
    loadDesignRequests(); // Tải dữ liệu yêu cầu
});

// 3. BẢO VỆ TRANG
async function checkUserSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        // Nếu chưa đăng nhập, đá về trang login
        window.location.href = './login.html';
    }
}

// 4. TẢI DỮ LIỆU YÊU CẦU THIẾT KẾ
async function loadDesignRequests() {
    const tableBody = document.getElementById('designs-table-body');
    if (!tableBody) return;

    // Đây là câu query phức tạp (JOIN 2 lần trên cùng 1 bảng)
    // Dùng alias (bí danh) để phân biệt
    const { data: requests, error } = await supabase
        .from('design_requests')
        .select(`
            id,
            title,
            created_at,
            status,
            requester_profile:profiles!requester_id ( full_name ),
            assignee_profile:profiles!assignee_id ( full_name )
        `)
        .order('created_at', { ascending: false }); // Mới nhất lên đầu

    if (error) {
        console.error('Lỗi khi tải danh sách yêu cầu thiết kế:', error);
        tableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-red-500">Không thể tải dữ liệu.</td></tr>`;
        return;
    }

    // Nếu không có yêu cầu nào
    if (requests.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">Chưa có yêu cầu thiết kế nào.</td></tr>`;
        return;
    }

    // Xóa dòng "Đang tải..." mẫu
    tableBody.innerHTML = '';

    // Lặp qua từng yêu cầu và tạo hàng (row) mới
    requests.forEach(request => {
        const row = document.createElement('tr');
        
        // Lấy dữ liệu JOIN một cách an toàn
        // request.requester_profile là một object { full_name: '...' }
        const requesterName = request.requester_profile ? request.requester_profile.full_name : 'N/A';
        
        // request.assignee_profile là một object { full_name: '...' }
        const assigneeName = request.assignee_profile ? request.assignee_profile.full_name : 'Chưa gán';

        // Định dạng ngày (dd/mm/yyyy)
        const createdDate = new Date(request.created_at).toLocaleDateString('vi-VN');
            
        // Định dạng trạng thái (status)
        const statusBadge = formatDesignStatus(request.status);

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${request.title}</div>
            </td>
            
            <td class.="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${requesterName}</div>
            </td>
            
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500">${assigneeName}</div>
            </td>

            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${createdDate}</div>
            </td>
            
            <td class="px-6 py-4 whitespace-nowrap">
                ${statusBadge}
            </td>
            
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <a href="#" class="text-indigo-600 hover:text-indigo-900">Xem</a>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// 5. HÀM HỖ TRỢ: Định dạng trạng thái yêu cầu thiết kế
function formatDesignStatus(status) {
    switch (status) {
        case 'Mới':
            return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Mới</span>`;
        case 'Đang thiết kế':
            return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Đang thiết kế</span>`;
        case 'Chờ duyệt':
            return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">Chờ duyệt</span>`;
        case 'Hoàn thành':
            return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Hoàn thành</span>`;
        default:
            return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">${status || 'N/A'}</span>`;
    }
}