
// بيانات المستخدمين
const users = {
    'تسنيم': { name: 'بنت', type: 'girl' },
    'زاكي': { name: 'ولد', type: 'boy' }
};

let currentUser = null;
let currentUserType = null;

// تسجيل الدخول
function login() {
    const password = document.getElementById('password').value.trim();
    const errorMsg = document.getElementById('error-msg');

    if (!password) {
        errorMsg.textContent = 'أدخل كلمة السر';
        return;
    }

    if (users[password]) {
        currentUser = password;
        currentUserType = users[password].type;
        // إزالة حفظ الجلسة - سيطلب كلمة السر في كل مرة
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('chat-screen').style.display = 'flex';
        document.getElementById('username-display').textContent = users[password].name;
        loadMessages();
    } else {
        errorMsg.textContent = 'كلمة السر خاطئة';
    }
}

// تسجيل الخروج
function logout() {
    currentUser = null;
    currentUserType = null;
    localStorage.removeItem('currentUser');
    document.getElementById('chat-screen').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('password').value = '';
    document.getElementById('error-msg').textContent = '';
}

// تحميل الرسائل
async function loadMessages() {
    try {
        const response = await fetch('/messages');
        const messages = await response.json();
        displayMessages(messages);
    } catch (error) {
        console.error('خطأ في تحميل الرسائل:', error);
    }
}

// عرض الرسائل
function displayMessages(messages) {
    const container = document.getElementById('messages-container');
    container.innerHTML = '';
    
    messages.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${msg.user}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        if (msg.type === 'image') {
            const img = document.createElement('img');
            img.src = msg.text;
            img.className = 'message-image';
            contentDiv.appendChild(img);
        } else {
            contentDiv.innerHTML = linkify(msg.text);
        }
        
        messageDiv.appendChild(contentDiv);
        container.appendChild(messageDiv);
    });
    
    container.scrollTop = container.scrollHeight;
}

// تحويل الروابط إلى عناصر قابلة للنقر
function linkify(text) {
    const urlPattern = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return text.replace(urlPattern, '<a href="$1" target="_blank">$1</a>');
}

// إرسال رسالة
async function sendMessage() {
    const input = document.getElementById('message-input');
    const text = input.value.trim();
    
    if (!text) return;
    
    try {
        await fetch('/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                user: currentUserType, 
                text: text,
                type: 'text'
            })
        });
        
        input.value = '';
        input.style.height = 'auto';
        loadMessages();
    } catch (error) {
        console.error('خطأ في إرسال الرسالة:', error);
    }
}

// اختيار صورة
function selectImage() {
    document.getElementById('image-input').click();
}

// معالجة الصورة المختارة وضغطها
async function handleImageSelect() {
    const fileInput = document.getElementById('image-input');
    const file = fileInput.files[0];
    
    if (!file) return;
    
    // التحقق من نوع الملف
    if (!file.type.startsWith('image/')) {
        alert('الرجاء اختيار صورة صحيحة');
        return;
    }
    
    try {
        // ضغط الصورة قبل الإرسال
        const compressedImage = await compressImage(file);
        
        await fetch('/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                user: currentUserType, 
                text: compressedImage,
                type: 'image'
            })
        });
        
        fileInput.value = '';
        loadMessages();
    } catch (error) {
        console.error('خطأ في إرسال الصورة:', error);
        alert('حدث خطأ في إرسال الصورة. حاول مرة أخرى.');
    }
}

// دالة لضغط الصور
function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // تحديد الحد الأقصى للأبعاد
                const maxSize = 1200;
                if (width > height && width > maxSize) {
                    height *= maxSize / width;
                    width = maxSize;
                } else if (height > maxSize) {
                    width *= maxSize / height;
                    height = maxSize;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // تحويل إلى base64 مع ضغط بجودة 0.7
                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve(compressedDataUrl);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// تعديل حجم textarea تلقائياً
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('message-input');
    if (input) {
        // إرسال بالضغط على Enter (بدون Shift)
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        // تعديل الحجم تلقائياً
        input.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }
    
    // تم إزالة استرجاع الجلسة - سيطلب كلمة السر دائماً
});
