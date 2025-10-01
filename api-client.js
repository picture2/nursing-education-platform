// ملف للتعامل مع API الخاص بالسيرفر
const API_BASE_URL = 'http://localhost:3000/api';

// دالة عامة للطلبات
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'حدث خطأ في الطلب');
        }

        return data.data;
    } catch (error) {
        console.error('خطأ في الطلب:', error);
        throw error;
    }
}

// ========== الأقسام (Sections) ==========

async function getAllSections() {
    return await apiRequest('/sections');
}

async function addSection(sectionData) {
    return await apiRequest('/sections', {
        method: 'POST',
        body: JSON.stringify(sectionData)
    });
}

async function updateSection(id, sectionData) {
    return await apiRequest(`/sections/${id}`, {
        method: 'PUT',
        body: JSON.stringify(sectionData)
    });
}

async function deleteSection(id) {
    return await apiRequest(`/sections/${id}`, {
        method: 'DELETE'
    });
}

// ========== المستخدمين (Users) ==========

async function getAllUsers() {
    return await apiRequest('/users');
}

async function registerUser(userData) {
    return await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify(userData)
    });
}

async function loginUser(email, password) {
    return await apiRequest('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
}

// ========== ملفات PDF ==========

async function getAllPDFs() {
    return await apiRequest('/pdfs');
}

async function getPDFsBySection(sectionId) {
    return await apiRequest(`/pdfs/section/${sectionId}`);
}

async function uploadPDF(formData) {
    try {
        const response = await fetch(`${API_BASE_URL}/pdfs/upload`, {
            method: 'POST',
            body: formData // FormData لا يحتاج Content-Type
        });

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'حدث خطأ في رفع الملف');
        }

        return data.data;
    } catch (error) {
        console.error('خطأ في رفع الملف:', error);
        throw error;
    }
}

async function deletePDF(id) {
    return await apiRequest(`/pdfs/${id}`, {
        method: 'DELETE'
    });
}

async function incrementPDFView(id) {
    return await apiRequest(`/pdfs/${id}/view`, {
        method: 'POST'
    });
}

// ========== الإحصائيات ==========

async function getStats() {
    return await apiRequest('/stats');
}

// ========== دوال مساعدة ==========

function showLoading(message = 'جاري التحميل...') {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        const loadingText = loadingOverlay.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = message;
        }
        loadingOverlay.classList.add('show');
    }
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('show');
    }
}

function showMessage(message, type = 'success') {
    const icon = type === 'success' ? '✅' : '❌';
    alert(`${icon} ${message}`);
}

function showError(error) {
    console.error('Error:', error);
    showMessage(error.message || 'حدث خطأ غير متوقع', 'error');
}
