// admin-resource-edit.js

// 1. KẾT NỐI SUPABASE
const SUPABASE_URL = 'https://gzvyvujgpuexdaubqrmy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dnl2dWpncHVleGRhdWJxcm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDg0MDUsImV4cCI6MjA3NjM4NDQwNX0.9QaC0I26YP2uiZeTuVB-GK3yQR2jwjq6FnNLQKLNrMw';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. HÀM CHẠY SAU KHI HTML TẢI XONG
document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logout-button');
    const editResourceForm = document.getElementById('edit-resource-form');

    if(logoutButton) {
        logoutButton.addEventListener('click', async () => { /* ... (code đăng xuất) ... */ });
    }
    if(editResourceForm) {
        editResourceForm.addEventListener('submit', handleFormSubmit);
    }

    checkUserSession();
    loadResourceData(); // Tải dữ liệu tài liệu cần sửa
});

// 3. BẢO VỆ TRANG
async function checkUserSession() { /* ... (Giữ nguyên code) ... */ }

// 4. TẢI DỮ LIỆU TÀI LIỆU CẦN SỬA LÊN FORM
async function loadResourceData() {
    const urlParams = new URLSearchParams(window.location.search);
    const resourceId = urlParams.get('id');

    if (!resourceId) {
        showMessage('Lỗi: Không tìm thấy ID tài liệu.', 'error');
        return;
    }

    // Lấy dữ liệu resource từ Supabase
    const { data: resource, error } = await supabase
        .from('resources')
        .select('*') // Lấy tất cả cột gốc
        .eq('id', resourceId)
        .single();

    if (error || !resource) {
        console.error('Lỗi tải tài liệu:', error);
        showMessage('Không thể tải dữ liệu tài liệu.', 'error');
        return;
    }

    // Điền dữ liệu vào form
    document.getElementById('resource_id').value = resource.id;
    document.getElementById('title').value = resource.title;
    document.getElementById('category').value = resource.category; // Chọn phân loại hiện tại

    // Hiển thị link file
    const fileUrlDisplay = document.getElementById('file_url_display');
    const fileUrlLink = document.getElementById('file_url_link');
    if (fileUrlDisplay && fileUrlLink && resource.file_url) {
        fileUrlDisplay.textContent = resource.file_url;
        fileUrlLink.href = resource.file_url;
        fileUrlLink.classList.remove('hidden');
    } else if (fileUrlDisplay) {
         fileUrlDisplay.textContent = 'Không có link file.';
    }
}

// 5. HÀM XỬ LÝ KHI GỬI FORM (UPDATE)
async function handleFormSubmit(event) {
    event.preventDefault();

    const formMessage = document.getElementById('form-message');
    const submitButton = document.getElementById('submit-button');
    const form = event.target;

    const formData = new FormData(form);
    const resourceId = formData.get('resource_id');

    if (!resourceId) {
        showMessage('Lỗi: Không tìm thấy ID tài liệu.', 'error');
        return;
    }

    // Chỉ cập nhật title và category
    const updatedData = {
        title: formData.get('title'),
        category: formData.get('category'),
        // KHÔNG cập nhật file_url hoặc uploader_id
    };

    if(submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Đang lưu...';
    }
    showMessage('Đang cập nhật tài liệu...', 'success');

    // GỌI SUPABASE ĐỂ UPDATE
    const { data, error } = await supabase
        .from('resources')
        .update(updatedData)
        .eq('id', resourceId)
        .select();

    if (error) {
        console.error('Lỗi khi cập nhật tài liệu:', error);
        showMessage(`Lỗi: ${error.message}`, 'error');
        if(submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Lưu thay đổi';
        }
    } else {
        console.log('Cập nhật tài liệu thành công:', data);
        showMessage('Cập nhật tài liệu thành công! Đang chuyển hướng...', 'success');

        setTimeout(() => {
            window.location.href = './admin-resources.html';
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