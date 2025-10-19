// admin-event-new.js

// 1. KẾT NỐI SUPABASE
const SUPABASE_URL = 'https://gzvyvujgpuexdaubqrmy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dnl2dWpncHVleGRhdWJxcm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDg0MDUsImV4cCI6MjA3NjM4NDQwNX0.9QaC0I26YP2uiZeTuVB-GK3yQR2jwjq6FnNLQKLNrMw';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. HÀM CHẠY SAU KHI HTML ĐÃ TẢI XONG
document.addEventListener('DOMContentLoaded', () => {
    // Lấy các thành tố HTML
    const logoutButton = document.getElementById('logout-button');
    const eventForm = document.getElementById('event-form');
    
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
    if(eventForm) {
        eventForm.addEventListener('submit', handleFormSubmit);
    }

    // Chạy các hàm khởi tạo
    checkUserSession(); // Bảo vệ trang
});

// 3. BẢO VỆ TRANG
async function checkUserSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        // Nếu chưa đăng nhập, đá về trang login
        window.location.href = './login.html';
    }
}

// 4. HÀM XỬ LÝ KHI GỬI FORM
async function handleFormSubmit(event) {
    // Ngăn trang tải lại
    event.preventDefault(); 
    
    const formMessage = document.getElementById('form-message');
    const form = event.target;

    // Lấy thông tin người dùng đang đăng nhập (để điền vào 'created_by')
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        showMessage('Lỗi: Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.', 'error');
        return;
    }
    
    // Lấy dữ liệu từ form
    const formData = new FormData(form);
    const eventData = {
        title: formData.get('title'),
        event_date: formData.get('event_date'),
        location: formData.get('location'),
        description: formData.get('description'),
        // Tùy chọn checkbox (nó trả về 'on' nếu được check)
        is_public: formData.get('is_public') === 'on', 
        // Lấy ID của người tạo
        created_by: user.id 
    };

    // 5. GỌI SUPABASE ĐỂ INSERT DỮ LIỆU
    const { data, error } = await supabase
        .from('events')
        .insert([eventData]) // Phải insert một mảng các object
        .select(); // Trả về dữ liệu đã được insert

    if (error) {
        // Nếu có lỗi
        console.error('Lỗi khi tạo sự kiện:', error);
        showMessage(`Lỗi: ${error.message}`, 'error');
    } else {
        // Nếu thành công
        console.log('Tạo sự kiện thành công:', data);
        showMessage('Tạo sự kiện thành công! Đang chuyển hướng...', 'success');
        
        // Vô hiệu hóa nút bấm để tránh double-click
        form.querySelector('button[type="submit"]').disabled = true;

        // Chờ 2 giây rồi chuyển về trang danh sách
        setTimeout(() => {
            window.location.href = './admin-events.html';
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