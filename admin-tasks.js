// admin-tasks.js

// 1. KẾT NỐI SUPABASE
const SUPABASE_URL = 'https://gzvyvujgpuexdaubqrmy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dnl2dWpncHVleGRhdWJxcm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDg0MDUsImV4cCI6MjA3NjM4NDQwNX0.9QaC0I26YP2uiZeTuVB-GK3yQR2jwjq6FnNLQKLNrMw';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. HÀM CHẠY SAU KHI HTML ĐÃ TẢI XONG
document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logout-button');
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
    checkUserSession();
    loadTasks();
});

// 3. BẢO VỆ TRANG
async function checkUserSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = './login.html';
    }
}

// 4. TẢI DỮ LIỆU CÔNG VIỆC (TASK)
async function loadTasks() {
    const tableBody = document.getElementById('tasks-table-body');
    if (!tableBody) return;

    // THAY ĐỔI: JOIN với 'events' thay vì 'projects'
    const { data: tasks, error } = await supabase
        .from('tasks')
        .select(`
            id,
            title,
            due_date,
            status,
            events ( title ),
            profiles ( full_name )
        `)
        .order('due_date', { ascending: true, nullsFirst: false }); 

    if (error) {
        console.error('Lỗi khi tải danh sách công việc:', error);
        tableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-red-500">Không thể tải dữ liệu công việc.</td></tr>`;
        return;
    }

    if (tasks.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">Chưa có công việc nào được giao.</td></tr>`;
        return;
    }

    tableBody.innerHTML = '';

    tasks.forEach(task => {
        const row = document.createElement('tr');
        
        // THAY ĐỔI: Lấy tên sự kiện
        const eventName = task.events ? task.events.title : 'Sự kiện chung';
        const assigneeName = task.profiles ? task.profiles.full_name : 'Chưa gán';
        const dueDate = task.due_date 
            ? new Date(task.due_date).toLocaleDateString('vi-VN') 
            : 'N/A';
        const statusBadge = formatTaskStatus(task.status);

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${task.title}</div>
            </td>
            
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500">${eventName}</div>
            </td>
            
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${assigneeName}</div>
            </td>

            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${dueDate}</div>
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

// 5. HÀM HỖ TRỢ: Định dạng trạng thái công việc
function formatTaskStatus(status) {
    switch (status) {
        case 'Mới':
            return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Mới</span>`;
        case 'Đang làm':
            return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Đang làm</span>`;
        case 'Chờ duyệt':
            return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">Chờ duyệt</span>`;
        case 'Hoàn thành':
            return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Hoàn thành</span>`;
        default:
            return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">${status || 'N/A'}</span>`;
    }
}