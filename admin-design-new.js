// admin-design-new.js

// 1. KẾT NỐI SUPABASE
const SUPABASE_URL = 'https://gzvyvujgpuexdaubqrmy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dnl2dWpncHVleGRhdWJxcm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDg0MDUsImV4cCI6MjA3NjM4NDQwNX0.9QaC0I26YP2uiZeTuVB-GK3yQR2jwjq6FnNLQKLNrMw';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. HÀM CHẠY SAU KHI HTML ĐÃ TẢI XONG
document.addEventListener('DOMContentLoaded', () => {
    // Lấy các thành tố HTML
    const logoutButton = document.getElementById('logout-button');
    const designForm = document.getElementById('design-form');
    
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
    if(designForm) {
        designForm.addEventListener('submit', handleFormSubmit);
    }

    // Chạy các hàm khởi tạo
    checkUserSession(); // Bảo vệ trang
    
    // Tải dữ liệu cho ô <select>
    loadDesigners(); 
});

// 3. BẢO VỆ TRANG
async function checkUserSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        // Nếu chưa đăng nhập, đá về trang login
        window.location.href = './login.html';
    }
}

// 4. TẢI DỮ LIỆU CHO Ô CHỌN (DROPDOWN) NHÀ THIẾT KẾ
async function loadDesigners() {
    const selectEl = document.getElementById('assignee_id');
    if (!selectEl) return;

    // Chỉ lấy thành viên mảng Truyền thông (truong_mang_tt hoặc thanh_vien_tt)
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('is_active', true) // Phải đang hoạt động
        .or('role.eq.truong_mang_tt,role.eq.thanh_vien_tt') // HOẶC là trưởng mảng TT, HOẶC là thành viên TT
        .order('full_name');

    if (error) {
        console.error('Lỗi tải thành viên mảng Truyền thông:', error);
        selectEl.innerHTML = '<option value="">Lỗi tải danh sách</option>';
        return;
    }

    // Xóa lựa chọn "Đang tải..."
    selectEl.innerHTML = '<option value="">-- Để trống (Trưởng mảng tự phân) --</option>';
    
    profiles.forEach(profile => {
        const option = document.createElement('option');
        option.value = profile.id;
        option.textContent = profile.full_name;
        selectEl.appendChild(option);
    });
}

// 5. HÀM XỬ LÝ KHI GỬI FORM
async function handleFormSubmit(event) {
    // Ngăn trang tải lại
    event.preventDefault(); 
    
    const formMessage = document.getElementById('form-message');
    const form = event.target;

    // Lấy thông tin người dùng đang đăng nhập (Người yêu cầu)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        showMessage('Lỗi: Không tìm thấy thông tin người yêu cầu. Vui lòng đăng nhập lại.', 'error');
        return;
    }
    
    // Lấy dữ liệu từ form
    const formData = new FormData(form);
    const requestData = {
        title: formData.get('title'),
        request_details: formData.get('request_details'),
        status: formData.get('status'), // Mặc định là 'Mới' (từ input 'hidden')
        requester_id: user.id, // ID của người đang đăng nhập
        assignee_id: formData.get('assignee_id') || null // Chuyển chuỗi rỗng thành 'null'
    };

    // 6. GỌI SUPABASE ĐỂ INSERT DỮ LIỆU
    const { data, error } = await supabase
        .from('design_requests')
        .insert([requestData]) // Phải insert một mảng các object
        .select(); // Trả về dữ liệu đã được insert

    if (error) {
        // Nếu có lỗi
        console.error('Lỗi khi tạo yêu cầu:', error);
        showMessage(`Lỗi: ${error.message}`, 'error');
    } else {
        // Nếu thành công
        console.log('Tạo yêu cầu thành công:', data);
        showMessage('Gửi yêu cầu thành công! Đang chuyển hướng...', 'success');
        
        // Vô hiệu hóa nút bấm để tránh double-click
        form.querySelector('button[type="submit"]').disabled = true;

        // Chờ 2 giây rồi chuyển về trang danh sách
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