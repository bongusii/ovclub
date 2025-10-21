// admin-task-edit.js

// 1. KẾT NỐI SUPABASE
const SUPABASE_URL = 'https://gzvyvujgpuexdaubqrmy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dnl2dWpncHVleGRhdWJxcm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDg0MDUsImV4cCI6MjA3NjM4NDQwNX0.9QaC0I26YP2uiZeTuVB-GK3yQR2jwjq6FnNLQKLNrMw';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. HÀM CHẠY SAU KHI HTML TẢI XONG
document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logout-button');
    const editTaskForm = document.getElementById('edit-task-form');
    
    if(logoutButton) {
        logoutButton.addEventListener('click', async () => { /* ... (code đăng xuất) ... */ });
    }
    if(editTaskForm) {
        editTaskForm.addEventListener('submit', handleFormSubmit);
    }

    checkUserSession(); 
    loadTaskData(); // Tải dữ liệu task cần sửa
    // Tải dữ liệu cho dropdowns (chạy song song)
    loadEventsForSelect();
    loadAssigneesForSelect();
});

// 3. BẢO VỆ TRANG
async function checkUserSession() { /* ... (Giữ nguyên code) ... */ }

// 4. TẢI DỮ LIỆU CÔNG VIỆC CẦN SỬA LÊN FORM
async function loadTaskData() {
    const urlParams = new URLSearchParams(window.location.search);
    const taskId = urlParams.get('id');

    if (!taskId) {
        showMessage('Lỗi: Không tìm thấy ID công việc.', 'error');
        return;
    }

    // Lấy dữ liệu task từ Supabase
    const { data: task, error } = await supabase
        .from('tasks')
        .select('*') // Lấy tất cả cột gốc
        .eq('id', taskId)
        .single();

    if (error) {
        console.error('Lỗi tải công việc:', error);
        showMessage('Không thể tải dữ liệu công việc.', 'error');
        return;
    }
    if (!task) {
        showMessage('Lỗi: Công việc không tồn tại.', 'error');
        return;
    }

    // Điền dữ liệu vào form
    document.getElementById('task_id').value = task.id;
    document.getElementById('title').value = task.title;
    document.getElementById('status').value = task.status; // Chọn trạng thái hiện tại
    
    // Xử lý ngày cho input type="date" (cần dạng YYYY-MM-DD)
    if (task.due_date) {
        const date = new Date(task.due_date);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        document.getElementById('due_date').value = `${year}-${month}-${day}`;
    }

    // Lưu ID sự kiện và người được giao hiện tại để chọn trong dropdown sau
    // Chúng ta sẽ dùng thuộc tính 'data-' để lưu tạm
    const form = document.getElementById('edit-task-form');
    form.dataset.currentEventId = task.event_id;
    form.dataset.currentAssigneeId = task.assignee_id;

    // Kích hoạt lại việc load dropdown (vì loadTaskData có thể chạy trước)
    await loadEventsForSelect(task.event_id);
    await loadAssigneesForSelect(task.assignee_id);
}

// 5. TẢI DỮ LIỆU SỰ KIỆN CHO DROPDOWN
async function loadEventsForSelect(selectedId = null) {
    const selectEl = document.getElementById('event_id'); 
    if (!selectEl) return;
    
    const { data: events, error } = await supabase 
        .from('events')
        .select('id, title')
        .order('event_date', { ascending: false });

    if (error) {
        console.error('Lỗi tải sự kiện:', error);
        selectEl.innerHTML = '<option value="">Lỗi tải</option>';
        selectEl.classList.remove('bg-gray-50'); // Bỏ màu nền loading
        return;
    }

    selectEl.innerHTML = '<option value="">-- Chọn sự kiện --</option>';
    
    events.forEach(event => {
        const option = document.createElement('option');
        option.value = event.id;
        option.textContent = event.title;
        // Tự động chọn sự kiện hiện tại của task
        if (selectedId && event.id == selectedId) {
            option.selected = true;
        }
        selectEl.appendChild(option);
    });
    selectEl.classList.remove('bg-gray-50'); // Bỏ màu nền loading
}

// 6. TẢI DỮ LIỆU THÀNH VIÊN CHO DROPDOWN
async function loadAssigneesForSelect(selectedId = null) {
    const selectEl = document.getElementById('assignee_id');
    if (!selectEl) return;

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('is_active', true) 
        .order('full_name');

    if (error) {
        console.error('Lỗi tải thành viên:', error);
        selectEl.innerHTML = '<option value="">Lỗi tải</option>';
        selectEl.classList.remove('bg-gray-50');
        return;
    }

    selectEl.innerHTML = '<option value="">-- Giao cho... --</option>';
    
    profiles.forEach(profile => {
        const option = document.createElement('option');
        option.value = profile.id;
        option.textContent = profile.full_name;
        // Tự động chọn người được giao hiện tại của task
        if (selectedId && profile.id === selectedId) {
             option.selected = true;
        }
        selectEl.appendChild(option);
    });
    selectEl.classList.remove('bg-gray-50');
}

// 7. HÀM XỬ LÝ KHI GỬI FORM (UPDATE)
async function handleFormSubmit(event) {
    event.preventDefault(); 
    
    const formMessage = document.getElementById('form-message');
    const submitButton = document.getElementById('submit-button');
    const form = event.target;
    
    const formData = new FormData(form);
    const taskId = formData.get('task_id'); // Lấy ID từ input ẩn

    if (!taskId) {
        showMessage('Lỗi: Không tìm thấy ID công việc.', 'error');
        return;
    }

    const updatedData = {
        title: formData.get('title'),
        event_id: formData.get('event_id'),
        assignee_id: formData.get('assignee_id'),
        due_date: formData.get('due_date') || null, 
        status: formData.get('status')
    };

    if(submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Đang lưu...';
    }
    showMessage('Đang cập nhật công việc...', 'success');

    // GỌI SUPABASE ĐỂ UPDATE
    const { data, error } = await supabase
        .from('tasks')
        .update(updatedData) 
        .eq('id', taskId)   
        .select();          

    if (error) {
        console.error('Lỗi khi cập nhật công việc:', error);
        showMessage(`Lỗi: ${error.message}`, 'error');
        if(submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Lưu thay đổi';
        }
    } else {
        console.log('Cập nhật công việc thành công:', data);
        showMessage('Cập nhật công việc thành công! Đang chuyển hướng...', 'success');
        
        setTimeout(() => {
            window.location.href = './admin-tasks.html';
        }, 2000);
    }
}

// 8. HÀM HỖ TRỢ: Hiển thị thông báo
function showMessage(message, type = 'error') { /* ... (Giữ nguyên code) ... */ }