// admin-task-new.js

// 1. KẾT NỐI SUPABASE
const SUPABASE_URL = 'https://gzvyvujgpuexdaubqrmy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dnl2dWpncHVleGRhdWJxcm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDg0MDUsImV4cCI6MjA3NjM4NDQwNX0.9QaC0I26YP2uiZeTuVB-GK3yQR2jwjq6FnNLQKLNrMw';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. HÀM CHẠY SAU KHI HTML ĐÃ TẢI XONG
document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logout-button');
    const taskForm = document.getElementById('task-form');
    
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

    // Gắn sự kiện Gửi (Submit) Form
    if(taskForm) {
        taskForm.addEventListener('submit', handleFormSubmit);
    }

    // Chạy các hàm khởi tạo
    checkUserSession(); 
    loadEventsForTasks(); // Tải Sự kiện
    loadAssignees(); // Tải Thành viên
});

// 3. BẢO VỆ TRANG
async function checkUserSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = './login.html';
    }
}

// 4. TẢI DỮ LIỆU CHO Ô CHỌN (DROPDOWN) SỰ KIỆN
async function loadEventsForTasks() {
    const selectEl = document.getElementById('event_id'); 
    if (!selectEl) return;

    // Lấy dữ liệu từ bảng 'events'
    const { data: events, error } = await supabase 
        .from('events')
        .select('id, title')
        .order('event_date', { ascending: false }); // Lấy sự kiện mới nhất lên đầu

    if (error) {
        console.error('Lỗi tải sự kiện:', error);
        selectEl.innerHTML = '<option value="">Lỗi tải danh sách</option>';
        return;
    }

    // Xóa dòng "Đang tải..."
    selectEl.innerHTML = '<option value="">-- Chọn một sự kiện --</option>';
    
    events.forEach(event => {
        const option = document.createElement('option');
        option.value = event.id;
        option.textContent = event.title;
        selectEl.appendChild(option);
    });
}

// 5. TẢI DỮ LIỆU CHO Ô CHỌN (DROPDOWN) THÀNH VIÊN
async function loadAssignees() {
    const selectEl = document.getElementById('assignee_id');
    if (!selectEl) return;

    // Lấy dữ liệu từ bảng 'profiles'
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('is_active', true) // Chỉ lấy thành viên đang hoạt động
        .order('full_name');

    if (error) {
        console.error('Lỗi tải thành viên:', error);
        selectEl.innerHTML = '<option value="">Lỗi tải danh sách</option>';
        return;
    }

    // Xóa dòng "Đang tải..."
    selectEl.innerHTML = '<option value="">-- Giao cho... --</option>';
    
    profiles.forEach(profile => {
        const option = document.createElement('option');
        option.value = profile.id;
        option.textContent = profile.full_name;
        selectEl.appendChild(option);
    });
}

// 6. HÀM XỬ LÝ KHI GỬI FORM
async function handleFormSubmit(event) {
    event.preventDefault(); 
    
    const formMessage = document.getElementById('form-message');
    const form = event.target;
    
    const formData = new FormData(form);
    
    // Lấy dữ liệu từ form, dùng 'event_id'
    const taskData = {
        title: formData.get('title'),
        event_id: formData.get('event_id'), // Đã thay đổi
        assignee_id: formData.get('assignee_id'),
        due_date: formData.get('due_date') || null, 
        status: formData.get('status')
    };

    // 7. GỌI SUPABASE ĐỂ INSERT DỮ LIỆU
    const { data, error } = await supabase
        .from('tasks')
        .insert([taskData])
        .select(); 

    if (error) {
        console.error('Lỗi khi tạo công việc:', error);
        showMessage(`Lỗi: ${error.message}`, 'error');
    } else {
        console.log('Tạo công việc thành công:', data);
        showMessage('Tạo công việc thành công! Đang chuyển hướng...', 'success');
        
        form.querySelector('button[type="submit"]').disabled = true;

        setTimeout(() => {
            window.location.href = './admin-tasks.html';
        }, 2000);
    }
}

// 8. HÀM HỖ TRỢ: Hiển thị thông báo
function showMessage(message, type = 'error') {
    const formMessage = document.getElementById('form-message');
    if (!formMessage) return;

    formMessage.textContent = message;
    formMessage.classList.remove('hidden');
    
    if (type === 'error') {
        formMessage.classList.add('text-red-600');
        formMessage.classList.remove('text-green-600');
    } else {
        formMessage.classList.add('text-green-600');
        formMessage.classList.remove('text-red-600');
    }
}