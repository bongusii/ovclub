// app.js

// Thay thế bằng URL và Key của BẠN từ cài đặt Supabase
const SUPABASE_URL = 'https://gzvyvujgpuexdaubqrmy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dnl2dWpncHVleGRhdWJxcm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDg0MDUsImV4cCI6MjA3NjM4NDQwNX0.9QaC0I26YP2uiZeTuVB-GK3yQR2jwjq6FnNLQKLNrMw'; // Cái key dài dài

// Khởi tạo Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('Đã kết nối Supabase!', supabase);

// ----- BÂY GIỜ BẠN ĐÃ SẴN SÀNG ĐỂ TƯƠNG TÁC VỚI BACK-END -----

// Ví dụ: Lấy 10 sự kiện từ bảng 'events' (sẽ tạo sau)
async function getEvents() {
    let { data: events, error } = await supabase
        .from('events') // 'events' là tên bảng
        .select('*')     // Lấy tất cả các cột
        .limit(10);      // Giới hạn 10
        
    if (error) {
        console.error('Lỗi khi lấy sự kiện:', error);
    } else {
        console.log('Các sự kiện:', events);
        // Ở đây bạn sẽ viết code để hiển thị 'events' ra HTML
    }
}

// Chạy thử hàm
// getEvents();