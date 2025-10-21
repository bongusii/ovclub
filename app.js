// app.js

// 1. KẾT NỐI SUPABASE
const SUPABASE_URL = 'https://gzvyvujgpuexdaubqrmy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dnl2dWpncHVleGRhdWJxcm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDg0MDUsImV4cCI6MjA3NjM4NDQwNX0.9QaC0I26YP2uiZeTuVB-GK3yQR2jwjq6FnNLQKLNrMw';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('Đã kết nối Supabase!', supabase);

// 2. HÀM CHẠY KHI TRANG TẢI XONG
document.addEventListener('DOMContentLoaded', () => {
    // Kiểm tra xem trang hiện tại là trang nào để chạy hàm tương ứng
    if (document.getElementById('upcoming-events-list')) { // Có trên trang events.html
        loadAllEvents();
    }
    if (document.getElementById('homepage-upcoming-events')) { // Có trên trang index.html
        loadHomepageEvents();
    }
});

// --- LOGIC CHO TRANG EVENTS.HTML ---

// 3. TẢI TẤT CẢ SỰ KIỆN CÔNG KHAI (cho events.html)
async function loadAllEvents() {
    const upcomingList = document.getElementById('upcoming-events-list');
    const pastList = document.getElementById('past-events-list');
    if (!upcomingList || !pastList) return; // Thoát nếu không tìm thấy element

    // Lấy tất cả sự kiện công khai (is_public = true)
    const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_public', true)
        .order('event_date', { ascending: false }); // Sắp xếp mới nhất lên đầu (cho cả 2 loại)

    if (error) {
        console.error('Lỗi tải sự kiện:', error);
        upcomingList.innerHTML = `<p class="text-red-500">Lỗi tải dữ liệu.</p>`;
        pastList.innerHTML = `<p class="text-red-500">Lỗi tải dữ liệu.</p>`;
        return;
    }

    // Phân loại sự kiện
    const now = new Date();
    const upcomingEvents = events.filter(event => new Date(event.event_date) >= now);
    const pastEvents = events.filter(event => new Date(event.event_date) < now);

    // Hiển thị sự kiện sắp diễn ra
    displayEvents(upcomingEvents, upcomingList, true); // true = isUpcoming

    // Hiển thị sự kiện đã diễn ra
    displayEvents(pastEvents, pastList, false); // false = isUpcoming
}

// 4. HÀM HIỂN THỊ DANH SÁCH SỰ KIỆN (Dùng chung)
function displayEvents(eventList, containerElement, isUpcoming) {
    if (eventList.length === 0) {
        containerElement.innerHTML = `<p class="col-span-full text-center text-gray-500">${isUpcoming ? 'Chưa có sự kiện nào sắp diễn ra.' : 'Chưa có hoạt động nào trong thư viện.'}</p>`;
        return;
    }

    containerElement.innerHTML = ''; // Xóa nội dung mẫu

    eventList.forEach(event => {
        const eventCard = document.createElement('div');
        eventCard.className = 'bg-white rounded-lg shadow-lg overflow-hidden';
        if (isUpcoming) {
            eventCard.classList.add('transition-transform', 'duration-300', 'hover:scale-105');
        }

        const eventDate = new Date(event.event_date).toLocaleString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        // Ảnh placeholder nếu không có poster_url
        const posterUrl = event.poster_url || `https://via.placeholder.com/400x250/${isUpcoming ? 'FACC15' : '9CA3AF'}/FFFFFF?text=Event+Image`;
        const imageClass = `w-full h-48 object-cover ${!isUpcoming ? 'filter grayscale' : ''}`;

        eventCard.innerHTML = `
            <img src="${posterUrl}" alt="Poster ${event.title}" class="${imageClass}">
            <div class="p-6">
                <span class="text-sm text-gray-500">${eventDate} | ${event.location || ''}</span>
                <h3 class="text-xl font-bold text-gray-900 mt-2 mb-3">${event.title}</h3>
                <p class="text-gray-600 mb-5">${event.description || ''}</p>
                <a href="#" class="font-semibold text-ongvang-dark hover:text-ongvang">
                    ${isUpcoming ? 'Xem chi tiết / Đăng ký &rarr;' : 'Xem bài tổng kết &rarr;'}
                </a>
                </div>
        `;
        containerElement.appendChild(eventCard);
    });
}

// --- LOGIC CHO TRANG INDEX.HTML ---

// 5. TẢI SỰ KIỆN SẮP DIỄN RA CHO TRANG CHỦ (index.html)
async function loadHomepageEvents() {
    const container = document.getElementById('homepage-upcoming-events');
    if (!container) return;

    const now = new Date().toISOString();

    // Lấy 3 sự kiện công khai sắp diễn ra gần nhất
    const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_public', true)
        .gte('event_date', now) // Lớn hơn hoặc bằng hôm nay
        .order('event_date', { ascending: true }) // Sắp xếp gần nhất lên đầu
        .limit(3); // Giới hạn 3 sự kiện

    if (error) {
        console.error('Lỗi tải sự kiện trang chủ:', error);
        container.innerHTML = `<p class="text-red-500">Lỗi tải sự kiện.</p>`;
        return;
    }

    // Dùng lại hàm displayEvents để hiển thị
    displayEvents(events, container, true); // true = isUpcoming
}