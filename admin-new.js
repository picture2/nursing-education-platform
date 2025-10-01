// ملف JavaScript لصفحة الإدارة مع دعم Backend

let sections = [];
let users = [];

// التحقق من صلاحيات الإدارة
function checkAdminAccess() {
    const adminUser = localStorage.getItem('adminUser');
    if (!adminUser) {
        console.log('No admin user found, redirecting to login...');
        alert('يجب تسجيل الدخول كإدارة أولاً');
        window.location.href = 'index.html';
        return false;
    }
    
    const admin = JSON.parse(adminUser);
    console.log('Admin user found:', admin);
    return true;
}

// تحميل البيانات من السيرفر
async function loadData() {
    try {
        showLoading('جاري تحميل البيانات...');
        
        // تحميل الأقسام
        sections = await getAllSections();
        console.log('تم تحميل الأقسام:', sections);
        
        // تحميل المستخدمين
        users = await getAllUsers();
        console.log('تم تحميل المستخدمين:', users);
        
        hideLoading();
    } catch (error) {
        hideLoading();
        showError(error);
    }
}

// عرض الأقسام
function renderSections() {
    const sectionsGrid = document.getElementById('sectionsGrid');
    if (!sectionsGrid) return;
    
    sectionsGrid.innerHTML = '';

    sections.forEach(section => {
        const sectionCard = document.createElement('div');
        sectionCard.className = 'section-card';

        // التحقق من نوع الأيقونة (صورة غلاف أو إيموجي)
        let cardStyle = '';
        let iconContent = '';
        let overlayClass = '';
        
        if (section.icon && section.icon.startsWith('data:image')) {
            // صورة - استخدمها كـ background cover
            cardStyle = `background-image: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${section.icon}); background-size: cover; background-position: center; color: white;`;
            overlayClass = 'has-image';
            iconContent = ''; // لا نحتاج أيقونة منفصلة
        } else if (section.icon && (section.icon.startsWith('fas') || section.icon.startsWith('fa-'))) {
            // FontAwesome icon
            iconContent = `<div class="section-icon"><i class="${section.icon}" style="font-size: 48px; color: #667eea;"></i></div>`;
        } else {
            // إيموجي
            iconContent = `<div class="section-icon"><span style="font-size: 48px;">${section.icon || '📁'}</span></div>`;
        }

        sectionCard.style.cssText = cardStyle;

        sectionCard.innerHTML = `
            ${iconContent}
            <div class="section-name" style="${overlayClass ? 'color: white; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.5);' : ''}">${section.title}</div>
            <div class="section-description" style="${overlayClass ? 'color: rgba(255,255,255,0.95);' : ''}">${section.description}</div>
            <div style="text-align: center; padding: 10px 0; ${overlayClass ? 'color: rgba(255,255,255,0.9);' : 'color: #667eea;'} font-size: 0.9rem; border-top: 1px solid ${overlayClass ? 'rgba(255,255,255,0.3)' : '#e9ecef'}; margin-top: 10px;">
                <i class="fas fa-hand-pointer"></i> اضغط على الكارت لعرض جميع ملفات PDF
            </div>
            <div class="section-actions">
                <button class="action-btn btn-add-pdf" onclick="addPDFToSection(${section.id})">
                    <i class="fas fa-plus"></i> إضافة PDF
                </button>
                <button class="action-btn btn-view" onclick="viewSectionPDFs(${section.id})">
                    <i class="fas fa-file-pdf"></i> عرض PDFs
                </button>
                <button class="action-btn btn-edit" onclick="editSection(${section.id})">
                    <i class="fas fa-edit"></i> تعديل
                </button>
                <button class="action-btn btn-delete" onclick="deleteSectionHandler(${section.id})">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
        `;

        // جعل الكارت قابل للنقر
        sectionCard.style.cursor = 'pointer';
        sectionCard.addEventListener('click', function(e) {
            // تجاهل الضغط إذا كان على زر
            if (!e.target.closest('button')) {
                viewSectionPDFs(section.id);
            }
        });

        sectionsGrid.appendChild(sectionCard);
    });
}

// عرض المستخدمين
function renderUsers() {
    const usersList = document.getElementById('usersList');
    if (!usersList) return;
    
    usersList.innerHTML = '';

    if (users.length === 0) {
        usersList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">لا يوجد مستخدمين مسجلين</p>';
        return;
    }

    users.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';

        userItem.innerHTML = `
            <div class="user-info">
                <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
                <div class="user-details">
                    <h4>${user.name}</h4>
                    <p>${user.email}</p>
                </div>
            </div>
        `;

        usersList.appendChild(userItem);
    });
}

// تحديث الإحصائيات
async function updateStats() {
    try {
        const stats = await getStats();
        
        document.getElementById('totalUsers').textContent = stats.totalUsers;
        document.getElementById('totalSections').textContent = stats.totalSections;
        document.getElementById('totalViews').textContent = stats.totalViews;
        document.getElementById('totalPDFs').textContent = stats.totalPDFs;
    } catch (error) {
        console.error('خطأ في تحديث الإحصائيات:', error);
    }
}

// معاينة الصورة
function previewImage(input) {
    const preview = document.getElementById('imagePreview');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = '<img src="' + e.target.result + '" alt="معاينة الصورة">';
        };
        reader.readAsDataURL(input.files[0]);
    } else {
        preview.innerHTML = '';
    }
}

// إضافة قسم جديد
async function handleAddSection(e) {
    e.preventDefault();
    
    const name = document.getElementById('sectionName').value;
    const icon = document.getElementById('sectionIcon').value;
    const description = document.getElementById('sectionDescription').value;
    const imageFile = document.getElementById('sectionImage').files[0];

    try {
        showLoading('جاري إضافة القسم...');
        
        let iconData = icon; // افتراضياً إيموجي

        // إذا تم رفع صورة، احفظها كـ base64
        if (imageFile) {
            iconData = await readFileAsDataURL(imageFile);
        }

        await addSection({
            title: name,
            description: description,
            icon: iconData
        });

        // مسح الفورم
        document.getElementById('addSectionForm').reset();
        document.getElementById('imagePreview').innerHTML = '';
        
        // إغلاق الـ Modal
        if (typeof closeAddModal === 'function') {
            closeAddModal();
        }
        
        // تحديث البيانات من السيرفر
        await loadData();
        renderSections();
        await updateStats();
        
        hideLoading();
        showMessage('✅ تم إضافة القسم بنجاح!');
    } catch (error) {
        hideLoading();
        showError(error);
    }
}

// قراءة ملف كـ Data URL
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// تعديل قسم
async function editSection(id) {
    const section = sections.find(s => s.id === id);
    if (!section) return;

    const newName = prompt('اسم القسم الجديد:', section.title);
    if (!newName) return;

    const newIcon = prompt('الأيقونة الجديدة (إيموجي):', section.icon);
    if (newIcon === null) return; // إذا ضغط المستخدم Cancel

    const newDescription = prompt('الوصف الجديد:', section.description);
    if (!newDescription) return;

    try {
        showLoading('جاري تحديث القسم...');
        
        await updateSection(id, {
            title: newName,
            icon: newIcon || section.icon,
            description: newDescription
        });

        await loadData();
        renderSections();
        
        hideLoading();
        showMessage('تم تحديث القسم بنجاح!');
    } catch (error) {
        hideLoading();
        showError(error);
    }
}

// حذف قسم
async function deleteSectionHandler(id) {
    if (!confirm('هل أنت متأكد من حذف هذا القسم؟')) return;

    try {
        showLoading('جاري حذف القسم...');
        
        await deleteSection(id);
        
        await loadData();
        renderSections();
        await updateStats();
        
        hideLoading();
        showMessage('تم حذف القسم بنجاح!');
    } catch (error) {
        hideLoading();
        showError(error);
    }
}

// إضافة PDF للقسم
async function addPDFToSection(sectionId) {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    
    // إنشاء واجهة رفع محسنة
    const uploadDiv = document.createElement('div');
    uploadDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Cairo', sans-serif;
    `;
    
    uploadDiv.innerHTML = `
        <div style="
            background: white;
            padding: 40px;
            border-radius: 20px;
            max-width: 500px;
            width: 90%;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        ">
            <h2 style="color: #667eea; margin-bottom: 20px;">
                <i class="fas fa-file-pdf"></i> رفع ملف PDF
            </h2>
            <p style="color: #666; margin-bottom: 30px;">
                إضافة ملف جديد لقسم: <strong>${section.title}</strong>
            </p>
            
            <div style="margin-bottom: 20px;">
                <input type="text" id="pdfTitle" placeholder="عنوان الملف..." 
                       style="width: 100%; padding: 15px; border: 2px solid #e9ecef; border-radius: 10px; font-size: 16px; margin-bottom: 15px;">
                <textarea id="pdfDescription" placeholder="وصف الملف..." rows="3"
                          style="width: 100%; padding: 15px; border: 2px solid #e9ecef; border-radius: 10px; font-size: 16px; resize: vertical;"></textarea>
            </div>
            
            <div id="uploadArea" style="
                border: 3px dashed #667eea;
                border-radius: 15px;
                padding: 40px;
                margin: 20px 0;
                background: #f8f9fa;
                cursor: pointer;
                transition: all 0.3s ease;
            ">
                <div style="font-size: 3rem; color: #667eea; margin-bottom: 15px;">📄</div>
                <div style="font-size: 1.2rem; color: #333; margin-bottom: 10px;">اضغط لاختيار ملف PDF</div>
                <div style="color: #666; font-size: 0.9rem;">أو اسحب الملف هنا</div>
                <input type="file" id="pdfFile" accept=".pdf" style="display: none;">
            </div>
            
            <div id="fileInfo" style="
                background: #e9ecef;
                padding: 15px;
                border-radius: 10px;
                margin: 15px 0;
                display: none;
            ">
                <div id="fileName" style="font-weight: 600; color: #333; margin-bottom: 5px;"></div>
                <div id="fileSize" style="color: #666;"></div>
            </div>
            
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button id="uploadBtn" style="
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                    border: none;
                    padding: 12px 25px;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: 600;
                ">رفع الملف</button>
                <button id="cancelBtn" style="
                    background: #6c757d;
                    color: white;
                    border: none;
                    padding: 12px 25px;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: 600;
                ">إلغاء</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(uploadDiv);
    
    const uploadArea = uploadDiv.querySelector('#uploadArea');
    const fileInput = uploadDiv.querySelector('#pdfFile');
    const fileInfo = uploadDiv.querySelector('#fileInfo');
    const fileName = uploadDiv.querySelector('#fileName');
    const fileSize = uploadDiv.querySelector('#fileSize');
    const uploadBtn = uploadDiv.querySelector('#uploadBtn');
    const cancelBtn = uploadDiv.querySelector('#cancelBtn');
    const titleInput = uploadDiv.querySelector('#pdfTitle');
    const descInput = uploadDiv.querySelector('#pdfDescription');
    
    let selectedFile = null;
    
    // إضافة تأثيرات التفاعل
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('mouseenter', () => {
        uploadArea.style.borderColor = '#28a745';
        uploadArea.style.background = '#e8f5e8';
    });
    uploadArea.addEventListener('mouseleave', () => {
        uploadArea.style.borderColor = '#667eea';
        uploadArea.style.background = '#f8f9fa';
    });
    
    // رفع بالسحب والإفلات
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#28a745';
        uploadArea.style.background = '#d4edda';
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '#667eea';
        uploadArea.style.background = '#f8f9fa';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#667eea';
        uploadArea.style.background = '#f8f9fa';
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });
    
    function handleFile(file) {
        if (file.type !== 'application/pdf') {
            alert('❌ يرجى اختيار ملف PDF فقط');
            return;
        }
        
        // التحقق من حجم الملف (50 ميجابايت)
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
            alert('❌ حجم الملف كبير جداً. الحد الأقصى 50 ميجابايت');
            return;
        }
        
        selectedFile = file;
        fileName.textContent = '📄 ' + file.name;
        fileSize.textContent = 'الحجم: ' + (file.size / 1024 / 1024).toFixed(2) + ' ميجابايت';
        fileInfo.style.display = 'block';
        
        // ملء العنوان تلقائياً إذا كان فارغاً
        if (!titleInput.value) {
            titleInput.value = file.name.replace('.pdf', '');
        }
    }
    
    uploadBtn.addEventListener('click', async () => {
        const title = titleInput.value.trim();
        const description = descInput.value.trim();
        
        if (!title || !description) {
            alert('❌ يرجى ملء جميع الحقول المطلوبة');
            return;
        }
        
        if (!selectedFile) {
            alert('❌ يرجى اختيار ملف PDF أولاً');
            return;
        }
        
        try {
            // تعطيل الزر وإظهار التحميل
            uploadBtn.disabled = true;
            uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الرفع...';
            
            // إنشاء FormData للرفع
            const formData = new FormData();
            formData.append('pdfFile', selectedFile);
            formData.append('sectionId', sectionId);
            formData.append('section', section.title);
            formData.append('title', title);
            formData.append('description', description);
            
            await uploadPDF(formData);
            
            uploadBtn.innerHTML = '<i class="fas fa-check"></i> تم الرفع بنجاح!';
            uploadBtn.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
            
            setTimeout(() => {
                document.body.removeChild(uploadDiv);
                showMessage('تم رفع الملف بنجاح!');
                updateStats(); // تحديث الإحصائيات
            }, 1500);
        } catch (error) {
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = 'رفع الملف';
            showError(error);
        }
    });
    
    cancelBtn.addEventListener('click', () => {
        document.body.removeChild(uploadDiv);
    });
    
    // إغلاق بالنقر خارج النافذة
    uploadDiv.addEventListener('click', (e) => {
        if (e.target === uploadDiv) {
            document.body.removeChild(uploadDiv);
        }
    });
}

// عرض PDFs للقسم
async function viewSectionPDFs(sectionId) {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    
    try {
        showLoading('جاري تحميل الملفات...');
        const sectionPDFs = await getPDFsBySection(sectionId);
        hideLoading();
        
        if (sectionPDFs.length === 0) {
            alert(`📚 لا توجد ملفات PDF في قسم "${section.title}"\n\nيمكنك إضافة ملفات جديدة بالنقر على "إضافة PDF"`);
            return;
        }
        
        displayPDFsModal(section, sectionPDFs);
    } catch (error) {
        hideLoading();
        showError(error);
    }
}

function displayPDFsModal(section, sectionPDFs) {
    // إنشاء نافذة عرض PDFs محسنة
    const viewDiv = document.createElement('div');
    viewDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Cairo', sans-serif;
        overflow-y: auto;
        padding: 20px;
    `;
    
    viewDiv.innerHTML = `
        <div style="
            background: white;
            padding: 30px;
            border-radius: 20px;
            max-width: 800px;
            width: 100%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                <h2 style="color: #667eea; margin: 0;">
                    <i class="fas fa-file-pdf"></i> ملفات PDF - ${section.title}
                </h2>
                <button id="closeBtn" style="
                    background: #dc3545;
                    color: white;
                    border: none;
                    padding: 8px 15px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                ">إغلاق</button>
            </div>
            
            <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 10px;">
                <div style="color: #666; font-size: 14px;">
                    <i class="fas fa-info-circle"></i> 
                    إجمالي الملفات: <strong>${sectionPDFs.length}</strong> ملف
                </div>
            </div>
            
            <div id="pdfsList" style="display: grid; gap: 15px;">
                ${sectionPDFs.map((pdf, index) => `
                    <div style="
                        border: 2px solid #e9ecef;
                        border-radius: 15px;
                        padding: 20px;
                        background: #f8f9fa;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.borderColor='#667eea'; this.style.background='#f0f2ff';" 
                       onmouseout="this.style.borderColor='#e9ecef'; this.style.background='#f8f9fa';">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                            <div>
                                <h3 style="color: #333; margin: 0 0 10px 0; font-size: 1.2rem;">
                                    📄 ${pdf.title}
                                </h3>
                                <p style="color: #666; margin: 0; line-height: 1.5;">
                                    ${pdf.description}
                                </p>
                            </div>
                            <div style="text-align: left; font-size: 12px; color: #666;">
                                <div>👁️ ${pdf.views} مشاهدة</div>
                                <div>📅 ${pdf.uploadDate || 'غير محدد'}</div>
                            </div>
                        </div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <div style="font-size: 14px; color: #666;">
                                <div>📁 ${pdf.filename}</div>
                                <div>💾 ${pdf.size}</div>
                            </div>
                            <div style="display: flex; gap: 10px;">
                                <button onclick="viewPDF('${pdf.id}')" style="
                                    background: linear-gradient(135deg, #007bff, #0056b3);
                                    color: white;
                                    border: none;
                                    padding: 8px 15px;
                                    border-radius: 8px;
                                    cursor: pointer;
                                    font-size: 12px;
                                ">عرض</button>
                                <button onclick="downloadPDF('${pdf.id}', '${pdf.filename}')" style="
                                    background: linear-gradient(135deg, #28a745, #20c997);
                                    color: white;
                                    border: none;
                                    padding: 8px 15px;
                                    border-radius: 8px;
                                    cursor: pointer;
                                    font-size: 12px;
                                ">تحميل</button>
                                <button onclick="deletePDFHandler('${pdf.id}')" style="
                                    background: linear-gradient(135deg, #dc3545, #c82333);
                                    color: white;
                                    border: none;
                                    padding: 8px 15px;
                                    border-radius: 8px;
                                    cursor: pointer;
                                    font-size: 12px;
                                ">حذف</button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    document.body.appendChild(viewDiv);
    
    // إضافة الدوال المطلوبة للنافذة
    window.viewPDF = function(pdfId) {
        const pdf = sectionPDFs.find(p => p.id == pdfId);
        if (pdf) {
            // زيادة عدد المشاهدات
            incrementPDFView(pdfId);
            
            // فتح PDF في نافذة جديدة
            window.open(`http://localhost:3000${pdf.path}`, '_blank');
        } else {
            alert('❌ لا يمكن عرض هذا الملف');
        }
    };
    
    window.downloadPDF = function(pdfId, filename) {
        const pdf = sectionPDFs.find(p => p.id == pdfId);
        if (pdf) {
            const link = document.createElement('a');
            link.href = `http://localhost:3000${pdf.path}`;
            link.download = filename;
            link.click();
        } else {
            alert('❌ لا يمكن تحميل هذا الملف');
        }
    };
    
    window.deletePDFHandler = async function(pdfId) {
        if (confirm('هل أنت متأكد من حذف هذا الملف؟')) {
            try {
                await deletePDF(pdfId);
                alert('✅ تم حذف الملف بنجاح!');
                document.body.removeChild(viewDiv);
                await updateStats();
            } catch (error) {
                showError(error);
            }
        }
    };
    
    // إغلاق النافذة
    viewDiv.querySelector('#closeBtn').addEventListener('click', () => {
        document.body.removeChild(viewDiv);
    });
    
    // إغلاق بالنقر خارج النافذة
    viewDiv.addEventListener('click', (e) => {
        if (e.target === viewDiv) {
            document.body.removeChild(viewDiv);
        }
    });
}

// تحديث الإدارة
async function refreshAdmin() {
    await loadData();
    renderSections();
    renderUsers();
    await updateStats();
    showMessage('تم تحديث البيانات!');
}

// تحديث البيانات (يُستخدم للـ refresh اليدوي)
async function refreshData() {
    console.log('🔄 تحديث البيانات من السيرفر...');
    await loadData();
    renderSections();
    renderUsers();
    await updateStats();
    console.log('✅ تم التحديث!');
}

// تهيئة الصفحة
async function initAdmin() {
    // التحقق من صلاحيات الإدارة أولاً
    if (!checkAdminAccess()) {
        return;
    }
    
    await loadData();
    renderSections();
    renderUsers();
    await updateStats();
    
    // ربط نموذج إضافة القسم
    const addSectionForm = document.getElementById('addSectionForm');
    if (addSectionForm) {
        addSectionForm.addEventListener('submit', handleAddSection);
    }
}

// تهيئة الصفحة عند التحميل
document.addEventListener('DOMContentLoaded', initAdmin);
