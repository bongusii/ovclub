// admin-member-new.js

// 1. KẾT NỐI SUPABASE
const SUPABASE_URL = 'https://gzvyvujgpuexdaubqrmy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dnl2dWpncHVleGRhdWJxcm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDg0MDUsImV4cCI6MjA3NjM4NDQwNX0.9QaC0I26YP2uiZeTuVB-GK3yQR2jwjq6FnNLQKLNrMw';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. HÀM CHẠY SAU KHI HTML ĐÃ TẢI XONG
document.addEventListener('DOMContentLoaded', () => {
    // Lấy các thành tố HTML
    const logoutButton = document.getElementById('logout-button');
    const memberForm = document.getElementById('member-form');
    
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
    if(memberForm) {
        memberForm.addEventListener('submit', handleFormSubmit);
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
    // TODO: Thêm kiểm tra quyền Admin/Trưởng mảng ở đây sau
}

// 4. HÀM XỬ LÝ KHI GỬI FORM
async function handleFormSubmit(event) {
    // Ngăn trang tải lại
    event.preventDefault(); 
    
    const formMessage = document.getElementById('form-message');
    const submitButton = document.getElementById('submit-button');
    const form = event.target;
    
    // Lấy dữ liệu từ form
    const formData = new FormData(form);
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirm_password');
    const fullName = formData.get('full_name');
    const role = formData.get('role');
    // ĐÃ THAY ĐỔI: Lấy mem_id
    const memId = formData.get('mem_id'); 

    // Kiểm tra mật khẩu khớp
    if (password !== confirmPassword) {
        showMessage('Mật khẩu xác nhận không khớp!', 'error');
        return;
    }
    
    // Vô hiệu hóa nút bấm
    submitButton.disabled = true;
    submitButton.textContent = 'Đang xử lý...';
    showMessage('Đang tạo tài khoản...', 'success');

    // 5. GỌI supabase.auth.signUp()
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: { 
                full_name: fullName, 
                role: role,
                // ĐÃ THAY ĐỔI: Truyền mem_id
                mem_id: memId || null 
            }
        }
    });

    if (error) {
        // Nếu có lỗi (email đã tồn tại, mật khẩu yếu...)
        console.error('Lỗi khi tạo tài khoản:', error);
        showMessage(`Lỗi: ${error.message}`, 'error');
        // Kích hoạt lại nút
        submitButton.disabled = false;
        submitButton.textContent = 'Tạo thành viên';
    } else if (data.user) {
        // Nếu thành công
        console.log('Tạo tài khoản thành công:', data.user);
        showMessage('Tạo tài khoản thành công! Đang chuyển hướng...', 'success');
        
        // Chờ 2 giây rồi chuyển về trang danh sách
        // (Lúc này Trigger trong DB đã chạy và tạo profile)
        setTimeout(() => {
            window.location.href = './admin-members.html';
        }, 2000);
    } else {
         // Trường hợp lạ (hiếm gặp)
         console.error('Lỗi không xác định khi tạo tài khoản:', data);
         showMessage('Lỗi không xác định. Vui lòng thử lại.', 'error');
         submitButton.disabled = false;
         submitButton.textContent = 'Tạo thành viên';
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