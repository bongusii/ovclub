// admin-tasks.js

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
        logoutButton.addEventListener('click', async () => {
             const { error } = await supabase.auth.signOut();
            if (!error) window.location.href = './login.html';
            else console.error('Lỗi đăng xuất:', error);
        });
    }
    checkUserSession(); // Sẽ gọi loadTasks và renderUI sau
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

    if (error || !profile) {
        currentUserRole = null;
        console.error("Lỗi lấy profile:", error);
    } else {
        currentUserRole = profile.role;
        console.log("Task page role:", currentUserRole);
    }

    renderUIBasedOnRole();
    loadTasks();
}

// 4. RENDER UI THEO ROLE
function renderUIBasedOnRole() {
    // Ẩn nút "+ Thêm công việc" nếu không phải Admin/Trưởng mảng
    const addTaskButton = document.querySelector('header a[href="./admin-task-new.html"]');
    if (addTaskButton) {
        if (currentUserRole !== 'chu_nhiem' && currentUserRole !== 'pho_chu_nhiem' &&
            currentUserRole !== 'truong_mang_sk' && currentUserRole !== 'truong_mang_tt') {
            addTaskButton.style.display = 'none';
        } else {
            addTaskButton.style.display = 'inline-block'; // Hoặc block
        }
    }
}

// 5. TẢI DỮ LIỆU CÔNG VIỆC (TASK)
async function loadTasks() {
    const tableBody = document.getElementById('tasks-table-body');
    if (!tableBody) return;

    // JOIN với 'events' và 'profiles'
    const { data: tasks, error } = await supabase
        .from('tasks')
        .select(`id, title, due_date, status, events ( title ), profiles ( full_name )`)
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

    tableBody.innerHTML = ''; // Xóa dòng mẫu

    tasks.forEach(task => {
        const row = document.createElement('tr');
        const eventName = task.events ? task.events.title : 'Sự kiện chung';
        const assigneeName = task.profiles ? task.profiles.full_name : 'Chưa gán';
        const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString('vi-VN') : 'N/A';
        const statusBadge = formatTaskStatus(task.status);

        // Tạo chuỗi HTML cho hành động
        let actionsHtml = '';
        // Chỉ Admin/Trưởng mảng mới thấy Sửa/Xóa
        if (currentUserRole === 'chu_nhiem' || currentUserRole === 'pho_chu_nhiem' ||
            currentUserRole === 'truong_mang_sk' || currentUserRole === 'truong_mang_tt') {
            actionsHtml += `<a href="./admin-task-edit.html?id=${task.id}" class="text-indigo-600 hover:text-indigo-900 mr-3">Sửa</a>`;
            actionsHtml += `<button data-task-id="${task.id}" data-task-title="${task.title}" class="text-red-600 hover:text-red-900 delete-task-button">Xóa</button>`;
        } else {
            actionsHtml = `<span class="text-gray-400">Không có quyền</span>`; // Hoặc để trống
        }

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm font-medium text-gray-900">${task.title}</div></td>
            <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm text-gray-500">${eventName}</div></td>
            <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm text-gray-900">${assigneeName}</div></td>
            <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm text-gray-900">${dueDate}</div></td>
            <td class="px-6 py-4 whitespace-nowrap">${statusBadge}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">${actionsHtml}</td>
        `;
        tableBody.appendChild(row);
    });

    // Gắn sự kiện cho các nút Xóa (nếu có)
    const deleteButtons = tableBody.querySelectorAll('.delete-task-button');
    deleteButtons.forEach(button => {
        button.addEventListener('click', handleDeleteTaskClick);
    });
}

// 6. HÀM XỬ LÝ CLICK NÚT XÓA TASK
async function handleDeleteTaskClick(event) {
    const button = event.target;
    const taskId = button.dataset.taskId;
    const taskTitle = button.dataset.taskTitle;

    const isConfirmed = window.confirm(`Bạn có chắc chắn muốn xóa công việc "${taskTitle}" không?`);

    if (isConfirmed) {
        console.log(`Đang xóa công việc ID: ${taskId}`);
        try {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', taskId);

            if (error) throw error;
            alert(`Đã xóa thành công công việc "${taskTitle}".`);
            loadTasks(); // Cập nhật lại bảng
        } catch (error) {
            console.error('Lỗi khi xóa công việc:', error);
            alert(`Lỗi khi xóa công việc: ${error.message}`);
        }
    } else {
        console.log('Hủy xóa công việc.');
    }
}

// 7. HÀM HỖ TRỢ: Định dạng trạng thái công việc
function formatTaskStatus(status) {
    switch (status) {
        case 'Mới': return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Mới</span>`;
        case 'Đang làm': return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Đang làm</span>`;
        case 'Chờ duyệt': return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">Chờ duyệt</span>`;
        case 'Hoàn thành': return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Hoàn thành</span>`;
        default: return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">${status || 'N/A'}</span>`;
    }
}