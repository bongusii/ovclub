// admin-resource-new.js

// 1. KẾT NỐI SUPABASE
const SUPABASE_URL = 'https://gzvyvujgpuexdaubqrmy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dnl2dWpncHVleGRhdWJxcm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDg0MDUsImV4cCI6MjA3NjM4NDQwNX0.9QaC0I26YP2uiZeTuVB-GK3yQR2jwjq6FnNLQKLNrMw';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. HÀM CHẠY SAU KHI HTML ĐÃ TẢI XONG
document.addEventListener('DOMContentLoaded', () => {
    // Lấy các thành tố HTML
    const logoutButton = document.getElementById('logout-button');
    const resourceForm = document.getElementById('resource-form');
    
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
    if(resourceForm) {
        resourceForm.addEventListener('submit', handleFormSubmit);
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

// 4. HÀM XỬ LÝ KHI GỬI FORM (LOGIC 2 BƯỚC)
async function handleFormSubmit(event) {
    // Ngăn trang tải lại
    event.preventDefault(); 
    
    const formMessage = document.getElementById('form-message');
    const submitButton = document.getElementById('submit-button');
    const form = event.target;
    
    // Lấy file từ input
    const fileInput = document.getElementById('file_input');
    const file = fileInput.files[0];

    // Lấy dữ liệu văn bản từ form
    const formData = new FormData(form);
    const title = formData.get('title');
    const category = formData.get('category'); // Giá trị gốc có dấu

    // Kiểm tra cơ bản
    if (!file) {
        showMessage('Vui lòng chọn một file để tải lên.', 'error');
        return;
    }
    if (!title || !category) {
         showMessage('Vui lòng điền tên và chọn phân loại.', 'error');
        return;
    }
    
    // Lấy thông tin người dùng đang đăng nhập (Người tải lên)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        showMessage('Lỗi: Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.', 'error');
        return;
    }

    // Vô hiệu hóa nút bấm và hiển thị trạng thái
    submitButton.disabled = true;
    submitButton.textContent = 'Đang tải lên...';
    showMessage('Đang xử lý, vui lòng chờ...', 'success');

    try {
        // --- BƯỚC 1: TẢI FILE LÊN STORAGE ---
        
        // Chuyển đổi category thành tên thư mục an toàn (không dấu, không khoảng trắng)
        const safeCategoryFolder = slugify(category); // Ví dụ: "Sự kiện" -> "su-kien"
        
        // Tạo tên file duy nhất và an toàn
        const fileName = `${Date.now()}-${slugify(file.name)}`; 
        const filePath = `${safeCategoryFolder}/${fileName}`; 

        // Tải file lên bucket 'resources'
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('resources') // Tên BUCKET
            .upload(filePath, file);

        if (uploadError) {
            // Nếu tải file thất bại
            throw uploadError;
        }

        // --- BƯỚC 2: LẤY PUBLIC URL CỦA FILE ---
        const { data: urlData } = supabase
            .storage
            .from('resources') // Tên BUCKET
            .getPublicUrl(uploadData.path); // Lấy URL từ path đã upload
            
        const publicUrl = urlData.publicUrl;

        // --- BƯỚC 3: LƯU THÔNG TIN VÀO DATABASE ---
        const resourceData = {
            title: title,
            category: category, // Lưu category gốc (có dấu) vào DB
            file_url: publicUrl, // Chỉ lưu URL công khai
            uploader_id: user.id
        };

        const { data: dbData, error: dbError } = await supabase
            .from('resources') // Tên BẢNG
            .insert([resourceData]);

        if (dbError) {
            // Nếu lưu database thất bại
            throw dbError;
        }

        // --- THÀNH CÔNG ---
        showMessage('Tải lên tài liệu thành công! Đang chuyển hướng...', 'success');
        
        // Chờ 2 giây rồi chuyển về trang danh sách
        setTimeout(() => {
            window.location.href = './admin-resources.html';
        }, 2000);

    } catch (error) {
        // Bắt bất kỳ lỗi nào từ (1), (2), hoặc (3)
        console.error('Lỗi khi tải lên tài liệu:', error);
        showMessage(`Lỗi: ${error.message}`, 'error');
        // Kích hoạt lại nút nếu có lỗi
        submitButton.disabled = false;
        submitButton.textContent = 'Tải lên';
    }
}

// 5. HÀM HỖ TRỢ: Hiển thị thông báo
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

// 6. HÀM HỖ TRỢ: Chuyển đổi chuỗi thành dạng "slug"
function slugify(str) {
  str = str.replace(/^\s+|\s+$/g, ''); // trim
  str = str.toLowerCase();

  // remove accents, swap ñ for n, etc
  var from = "àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ·/_,:;";
  var to   = "aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd------";
  for (var i=0, l=from.length ; i<l ; i++) {
    str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
  }

  str = str.replace(/[^a-z0-9 -.]/g, '') // remove invalid chars, keep dots
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-'); // collapse dashes

  return str;
}