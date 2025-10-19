// admin-events.js

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
    loadEvents(); // Tải dữ liệu sự kiện
});

// 3. BẢO VỆ TRANG
async function checkUserSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        // Nếu chưa đăng nhập, đá về trang login
        window.location.href = './login.html';
    }
}

// 4. TẢI DỮ LIỆU SỰ KIỆN
async function loadEvents() {
    const tableBody = document.getElementById('events-table-body');
    if (!tableBody) return;

    // Lấy tất cả dữ liệu từ bảng 'events'
    // Sắp xếp theo ngày diễn ra, sự kiện mới nhất lên đầu
    const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false }); // Mới nhất lên đầu

    if (error) {
        console.error('Lỗi khi tải danh sách sự kiện:', error);
        tableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-center text-red-500">Không thể tải dữ liệu sự kiện.</td></tr>`;
        return;
    }

    // Nếu không có sự kiện nào
    if (events.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">Chưa có sự kiện nào được tạo.</td></tr>`;
        return;
    }

    // Xóa dòng "Đang tải..." mẫu
    tableBody.innerHTML = '';

    // Lặp qua từng sự kiện và tạo hàng (row) mới
    events.forEach(event => {
        const row = document.createElement('tr');
        
        // Định dạng ngày cho dễ đọc (dd/mm/yyyy hh:mm)
        const eventDate = new Date(event.event_date).toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Định dạng trạng thái (status)
        // Kiểm tra xem sự kiện đã diễn ra chưa
        const isPastEvent = new Date(event.event_date) < new Date();
        
        let statusBadge;
        if (isPastEvent) {
             statusBadge = `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Đã diễn ra</span>`;
        } else if (event.is_public) {
            statusBadge = `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Sắp diễn ra (Công khai)</span>`;
        } else {
            statusBadge = `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Bản nháp (Ẩn)</span>`;
        }


        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${event.title}</div>
            </td>
            
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${eventDate}</div>
            </td>
            
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${event.location || 'N/A'}</div>
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