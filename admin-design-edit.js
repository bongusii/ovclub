// admin-design-edit.js

// 1. KẾT NỐI SUPABASE
const SUPABASE_URL = 'https://gzvyvujgpuexdaubqrmy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dnl2dWpncHVleGRhdWJxcm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDg0MDUsImV4cCI6MjA3NjM4NDQwNX0.9QaC0I26YP2uiZeTuVB-GK3yQR2jwjq6FnNLQKLNrMw';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. HÀM CHẠY SAU KHI HTML TẢI XONG
document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logout-button');
    const editDesignForm = document.getElementById('edit-design-form');

    if(logoutButton) {
        logoutButton.addEventListener('click', async () => { /* ... (code đăng xuất) ... */ });
    }
    if(editDesignForm) {
        editDesignForm.addEventListener('submit', handleFormSubmit);
    }

    checkUserSession();
    loadRequestData(); // Tải dữ liệu request cần sửa
    loadDesignersForSelect(); // Tải danh sách designers
});

// 3. BẢO VỆ TRANG
async function checkUserSession() { /* ... (Giữ nguyên code) ... */ }

// 4. TẢI DỮ LIỆU YÊU CẦU CẦN SỬA LÊN FORM
async function loadRequestData() {
    const urlParams = new URLSearchParams(window.location.search);
    const requestId = urlParams.get('id');

    if (!requestId) {
        showMessage('Lỗi: Không tìm thấy ID yêu cầu.', 'error');
        return;
    }

    // Lấy dữ liệu request từ Supabase
    const { data: request, error } = await supabase
        .from('design_requests')
        .select('*') // Lấy tất cả cột gốc
        .eq('id', requestId)
        .single();

    if (error) {
        console.error('Lỗi tải yêu cầu thiết kế:', error);
        showMessage('Không thể tải dữ liệu yêu cầu.', 'error');
        return;
    }
    if (!request) {
        showMessage('Lỗi: Yêu cầu không tồn tại.', 'error');
        return;
    }

    // Điền dữ liệu vào form
    document.getElementById('request_id').value = request.id;
    document.getElementById('title').value = request.title;
    document.getElementById('request_details').value = request.request_details || '';
    document.getElementById('status').value = request.status; // Chọn trạng thái hiện tại
    document.getElementById('final_product_url').value = request.final_product_url || '';

    // Lưu ID người được giao hiện tại để chọn trong dropdown sau
    const form = document.getElementById('edit-design-form');
    form.dataset.currentAssigneeId = request.assignee_id;

    // Kích hoạt lại việc load dropdown (vì loadRequestData có thể chạy trước)
    await loadDesignersForSelect(request.assignee_id);
}

// 5. TẢI DỮ LIỆU NHÀ THIẾT KẾ CHO DROPDOWN
async function loadDesignersForSelect(selectedId = null) {
    const selectEl = document.getElementById('assignee_id');
    if (!selectEl) return;

    // Chỉ lấy thành viên mảng Truyền thông
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('is_active', true)
        .or('role.eq.truong_mang_tt,role.eq.thanh_vien_tt')
        .order('full_name');

    if (error) {
        console.error('Lỗi tải designers:', error);
        selectEl.innerHTML = '<option value="">Lỗi tải</option>';
        selectEl.classList.remove('bg-gray-50');
        return;
    }

    selectEl.innerHTML = '<option value="">-- Bỏ gán / Chưa gán --</option>'; // Thêm lựa chọn bỏ gán

    profiles.forEach(profile => {
        const option = document.createElement('option');
        option.value = profile.id;
        option.textContent = profile.full_name;
        // Tự động chọn người được giao hiện tại
        if (selectedId && profile.id === selectedId) {
             option.selected = true;
        }
        selectEl.appendChild(option);
    });
    selectEl.classList.remove('bg-gray-50');
}

// 6. HÀM XỬ LÝ KHI GỬI FORM (UPDATE)
async function handleFormSubmit(event) {
    event.preventDefault();

    const formMessage = document.getElementById('form-message');
    const submitButton = document.getElementById('submit-button');
    const form = event.target;

    const formData = new FormData(form);
    const requestId = formData.get('request_id');

    if (!requestId) {
        showMessage('Lỗi: Không tìm thấy ID yêu cầu.', 'error');
        return;
    }

    const updatedData = {
        title: formData.get('title'),
        request_details: formData.get('request_details'),
        status: formData.get('status'),
        // Nếu không chọn assignee, gửi null để bỏ gán
        assignee_id: formData.get('assignee_id') || null,
        final_product_url: formData.get('final_product_url') || null
    };

    if(submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Đang lưu...';
    }
    showMessage('Đang cập nhật yêu cầu...', 'success');

    // GỌI SUPABASE ĐỂ UPDATE
    const { data, error } = await supabase
        .from('design_requests')
        .update(updatedData)
        .eq('id', requestId)
        .select();

    if (error) {
        console.error('Lỗi khi cập nhật yêu cầu:', error);
        showMessage(`Lỗi: ${error.message}`, 'error');
        if(submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Lưu thay đổi';
        }
    } else {
        console.log('Cập nhật yêu cầu thành công:', data);
        showMessage('Cập nhật yêu cầu thành công! Đang chuyển hướng...', 'success');

        setTimeout(() => {
            window.location.href = './admin-designs.html';
        }, 2000);
    }
}

// 7. HÀM HỖ TRỢ: Hiển thị thông báo
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