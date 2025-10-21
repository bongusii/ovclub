// admin-member-edit.js

// 1. KẾT NỐI SUPABASE
const SUPABASE_URL = 'https://gzvyvujgpuexdaubqrmy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dnl2dWpncHVleGRhdWJxcm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDg0MDUsImV4cCI6MjA3NjM4NDQwNX0.9QaC0I26YP2uiZeTuVB-GK3yQR2jwjq6FnNLQKLNrMw';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. HÀM CHẠY SAU KHI HTML TẢI XONG
document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logout-button');
    const editMemberForm = document.getElementById('edit-member-form');

    if(logoutButton) {
        logoutButton.addEventListener('click', async () => { /* ... (code đăng xuất) ... */ });
    }
    if(editMemberForm) {
        editMemberForm.addEventListener('submit', handleFormSubmit);
    }

    checkUserSession();
    loadMemberData(); // Tải dữ liệu thành viên cần sửa
});

// 3. BẢO VỆ TRANG
async function checkUserSession() { /* ... (Giữ nguyên code) ... */ }

// 4. TẢI DỮ LIỆU THÀNH VIÊN CẦN SỬA LÊN FORM
async function loadMemberData() {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id'); // Lấy User ID từ URL

    if (!userId) {
        showMessage('Lỗi: Không tìm thấy ID thành viên.', 'error');
        return;
    }

    // Lấy dữ liệu hồ sơ từ bảng 'profiles'
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (profileError || !profile) {
        console.error('Lỗi tải hồ sơ:', profileError);
        showMessage('Không thể tải dữ liệu hồ sơ thành viên.', 'error');
        return;
    }

    // Lấy email từ bảng 'auth.users' (Cần quyền admin hoặc policy phù hợp)
    // Tạm thời hiển thị ID nếu không lấy được email
    let userEmail = `ID: ${userId}`;
    // Chạy lệnh lấy thông tin user từ Auth phía server (cần tạo API Route hoặc Edge Function nếu dùng RLS chặt)
    // Tạm thời bỏ qua bước này để đơn giản
    // const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(userId); // <-- Cần quyền admin
    // if (user) { userEmail = user.email; }

    // Điền dữ liệu vào form
    document.getElementById('user_id').value = profile.id;
    document.getElementById('email_display').value = userEmail; // Hiển thị email (hoặc ID)
    document.getElementById('full_name').value = profile.full_name;
    document.getElementById('role').value = profile.role;
    document.getElementById('mem_id').value = profile.mem_id || '';
    // Chuyển boolean thành chuỗi "true" hoặc "false" cho select
    document.getElementById('is_active').value = String(profile.is_active);
}


// 5. HÀM XỬ LÝ KHI GỬI FORM (UPDATE)
async function handleFormSubmit(event) {
    event.preventDefault();

    const formMessage = document.getElementById('form-message');
    const submitButton = document.getElementById('submit-button');
    const form = event.target;

    const formData = new FormData(form);
    const userId = formData.get('user_id'); // Lấy ID từ input ẩn

    if (!userId) {
        showMessage('Lỗi: Không tìm thấy ID thành viên.', 'error');
        return;
    }

    const updatedData = {
        full_name: formData.get('full_name'),
        role: formData.get('role'),
        mem_id: formData.get('mem_id') || null, // Chuyển chuỗi rỗng thành null
        // Chuyển chuỗi "true"/"false" từ select thành boolean
        is_active: formData.get('is_active') === 'true'
    };

    if(submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Đang lưu...';
    }
    showMessage('Đang cập nhật thông tin...', 'success');

    // GỌI SUPABASE ĐỂ UPDATE BẢNG 'profiles'
    const { data, error } = await supabase
        .from('profiles')
        .update(updatedData)
        .eq('id', userId) // Chỉ update hàng có ID khớp
        .select();

    if (error) {
        console.error('Lỗi khi cập nhật hồ sơ:', error);
        showMessage(`Lỗi: ${error.message}`, 'error');
        if(submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Lưu thay đổi';
        }
    } else {
        console.log('Cập nhật hồ sơ thành công:', data);
        showMessage('Cập nhật thông tin thành công! Đang chuyển hướng...', 'success');

        setTimeout(() => {
            window.location.href = './admin-members.html';
        }, 2000);
    }
}

// 6. HÀM HỖ TRỢ: Hiển thị thông báo
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