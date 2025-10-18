// auth.js

// 1. KẾT NỐI SUPABASE (Dùng URL và Key của bạn)
const SUPABASE_URL = 'https://gzvyvujgpuexdaubqrmy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dnl2dWpncHVleGRhdWJxcm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDg0MDUsImV4cCI6MjA3NjM4NDQwNX0.9QaC0I26YP2uiZeTuVB-GK3yQR2jwjq6FnNLQKLNrMw';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. LẤY CÁC THÀNH TỐ TỪ HTML
// Lấy form đăng nhập
const loginForm = document.getElementById('login-form');
// Lấy ô thông báo lỗi
const errorMessageDiv = document.getElementById('error-message');

// 3. THÊM BỘ LẮNG NGHE SỰ KIỆN "SUBMIT"
// Chạy hàm này khi người dùng nhấn nút "Đăng nhập"
loginForm.addEventListener('submit', async (event) => {
    // Ngăn trang web tải lại (hành vi mặc định của form)
    event.preventDefault();

    // Lấy giá trị từ các ô input
    const email = loginForm.email.value;
    const password = loginForm.password.value;

    // 4. GỌI SUPABASE ĐỂ ĐĂNG NHẬP
    // Dùng hàm signInWithPassword có sẵn của Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    // 5. XỬ LÝ KẾT QUẢ
    if (error) {
        // Nếu có lỗi (sai pass, email không tồn tại...)
        console.error('Lỗi đăng nhập:', error.message);
        // Hiển thị thông báo lỗi cho người dùng
        errorMessageDiv.textContent = 'Sai email hoặc mật khẩu. Vui lòng thử lại.';
        errorMessageDiv.classList.remove('hidden'); // Bỏ lớp 'hidden' để hiện nó ra
    } else {
        // Nếu đăng nhập thành công
        console.log('Đăng nhập thành công:', data);
        // Ẩn thông báo lỗi (nếu đang hiện)
        errorMessageDiv.classList.add('hidden');
        
        // Quan trọng: Chuyển hướng người dùng đến trang quản lý nội bộ
        // (Chúng ta sẽ tạo trang 'dashboard.html' này ở bước sau)
        window.location.href = '/dashboard.html';
    }
});