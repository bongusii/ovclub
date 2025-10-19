// admin-event-edit.js

// 1. KẾT NỐI SUPABASE
const SUPABASE_URL = 'https://gzvyvujgpuexdaubqrmy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dnl2dWpncHVleGRhdWJxcm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDg0MDUsImV4cCI6MjA3NjM4NDQwNX0.9QaC0I26YP2uiZeTuVB-GK3yQR2jwjq6FnNLQKLNrMw';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. HÀM CHẠY SAU KHI HTML ĐÃ TẢI XONG
document.addEventListener('DOMContentLoaded', () => {
    // Lấy các thành tố HTML
    const logoutButton = document.getElementById('logout-button');
    const editEventForm = document.getElementById('edit-event-form');

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
    if(editEventForm) {
        editEventForm.addEventListener('submit', handleFormSubmit);
    }

    // Chạy các hàm khởi tạo
    checkUserSession(); // Bảo vệ trang
    loadEventData(); // Tải dữ liệu sự kiện cần sửa
});

// 3. BẢO VỆ TRANG
async function checkUserSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        // Nếu chưa đăng nhập, đá về trang login
        window.location.href = './login.html';
    }
}

// 4. TẢI DỮ LIỆU SỰ KIỆN CẦN SỬA LÊN FORM
async function loadEventData() {
    // Lấy ID từ URL (ví dụ: ?id=123)
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');

    if (!eventId) {
        showMessage('Lỗi: Không tìm thấy ID sự kiện trong URL.', 'error');
        return;
    }

    // Lấy dữ liệu sự kiện từ Supabase dựa trên ID
    const { data: event, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId) // Tìm sự kiện có ID khớp
        .single(); // Lấy 1 kết quả duy nhất

    if (error) {
        console.error('Lỗi khi tải dữ liệu sự kiện:', error);
        showMessage('Không thể tải dữ liệu sự kiện.', 'error');
        return;
    }

    if (!event) {
        showMessage('Lỗi: Không tìm thấy sự kiện với ID này.', 'error');
        return;
    }

    // Điền dữ liệu vào form
    document.getElementById('event_id').value = event.id;
    document.getElementById('title').value = event.title;
    document.getElementById('location').value = event.location;
    document.getElementById('description').value = event.description || '';
    document.getElementById('is_public').checked = event.is_public;

    // Xử lý định dạng cho datetime-local input
    if (event.event_date) {
        const date = new Date(event.event_date);
        // Lấy thời gian theo múi giờ địa phương để hiển thị đúng
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        document.getElementById('event_date').value = `${year}-${month}-${day}T${hours}:${minutes}`;
    }
}


// 5. HÀM XỬ LÝ KHI GỬI FORM (UPDATE)
async function handleFormSubmit(event) {
    // Ngăn trang tải lại
    event.preventDefault();

    const formMessage = document.getElementById('form-message');
    const submitButton = document.getElementById('submit-button');
    const form = event.target;

    // Lấy dữ liệu từ form
    const formData = new FormData(form);
    const eventId = formData.get('event_id');

    // XỬ LÝ THỜI GIAN
    const localDateTimeString = formData.get('event_date');
    let isoDateTimeString = null;
    if (localDateTimeString) {
        const dateObject = new Date(localDateTimeString);
        isoDateTimeString = dateObject.toISOString(); // Chuyển sang UTC
    } else {
        showMessage('Vui lòng chọn ngày giờ diễn ra.', 'error');
        return;
    }


    const updatedData = {
        title: formData.get('title'),
        event_date: isoDateTimeString, // Gửi chuỗi UTC
        location: formData.get('location'),
        description: formData.get('description'),
        is_public: formData.get('is_public') === 'on'
    };

    if (!eventId) {
        showMessage('Lỗi: Không tìm thấy ID sự kiện để cập nhật.', 'error');
        return;
    }

    // Vô hiệu hóa nút bấm
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Đang lưu...';
    }
    showMessage('Đang cập nhật sự kiện...', 'success');

    // 6. GỌI SUPABASE ĐỂ UPDATE DỮ LIỆU
    const { data, error } = await supabase
        .from('events')
        .update(updatedData)
        .eq('id', eventId)
        .select();

    if (error) {
        console.error('Lỗi khi cập nhật sự kiện:', error);
        showMessage(`Lỗi: ${error.message}`, 'error');
        // Kích hoạt lại nút
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Lưu thay đổi';
        }
    } else {
        console.log('Cập nhật sự kiện thành công:', data);
        showMessage('Cập nhật sự kiện thành công! Đang chuyển hướng...', 'success');

        // Chờ 2 giây rồi chuyển về trang danh sách
        setTimeout(() => {
            window.location.href = './admin-events.html';
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