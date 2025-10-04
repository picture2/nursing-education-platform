# 📚 **شرح نظام رفع وعرض PDF - كامل**

## 📁 **الملفات الأساسية:**

```
1. admin-backend.html  ← رفع وإدارة PDF (للمشرف)
2. pdf-viewer.html     ← عرض PDF (للمستخدمين)
3. server.js           ← Backend API
4. data/pdfs.json      ← قاعدة البيانات
```

---

# 🔼 **1. رفع PDF (admin-backend.html)**

## **الخطوات:**

### **أ. اختيار القسم:**
```javascript
function openUploadPDFModal(sectionId, sectionTitle) {
    // حفظ معلومات القسم
    document.getElementById('pdfSectionId').value = sectionId;
    document.getElementById('uploadPDFSectionName').textContent = 'رفع ملف PDF للقسم: ' + sectionTitle;
    
    // فتح Modal
    document.getElementById('uploadPDFModal').style.display = 'flex';
}
```

### **ب. اختيار الملف + معلومات:**
```html
<input type="file" id="pdfFileInput" accept=".pdf">
<input type="file" id="coverImageInput" accept="image/*">
<input type="text" id="pdfTitle" placeholder="عنوان الملف">
<textarea id="pdfDescription" placeholder="وصف الملف"></textarea>
```

### **ج. الرفع مع Progress Bar:**
```javascript
async function confirmUploadPDF() {
    const file = document.getElementById('pdfFileInput').files[0];
    const coverImage = document.getElementById('coverImageInput').files[0];
    const title = document.getElementById('pdfTitle').value;
    const description = document.getElementById('pdfDescription').value;
    
    // إنشاء FormData
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('sectionId', sectionId);
    formData.append('title', title);
    formData.append('description', description);
    if (coverImage) {
        formData.append('coverImage', coverImage);
    }
    
    // رفع مع تتبع التقدم
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', function(e) {
        if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            const uploadedMB = (e.loaded / (1024 * 1024)).toFixed(2);
            const totalMB = (e.total / (1024 * 1024)).toFixed(2);
            
            // حساب الوقت المتبقي
            const elapsedTime = (Date.now() - startTime) / 1000;
            const uploadSpeed = e.loaded / elapsedTime;
            const remainingSeconds = Math.ceil((e.total - e.loaded) / uploadSpeed);
            
            // تحديث UI
            document.getElementById('uploadProgressBar').style.width = percent + '%';
            document.getElementById('uploadProgressText').textContent = percent + '%';
            document.getElementById('uploadProgressSize').textContent = uploadedMB + ' MB / ' + totalMB + ' MB';
            document.getElementById('uploadTimeRemaining').textContent = remainingSeconds + ' ثانية متبقية';
        }
    });
    
    xhr.open('POST', '/api/upload-pdf');
    xhr.send(formData);
}
```

### **د. عرض الملف فوراً:**
```javascript
if (data.success) {
    // ⚡ عرض فوري بدون انتظار
    await viewSectionPDFsWithNewFile(
        sectionId, 
        sectionTitle, 
        data.data  // ← البيانات المُرجعة من السيرفر
    );
}
```

---

# 📄 **2. عرض PDF في Admin (admin-backend.html)**

## **دالة العرض الفوري:**

```javascript
window.viewSectionPDFsWithNewFile = async function(sectionId, sectionTitle, newPDF) {
    // فتح Modal
    document.getElementById('viewPDFsSectionName').textContent = 'القسم: ' + sectionTitle;
    document.getElementById('viewPDFsModal').style.display = 'flex';
    
    // جلب جميع ملفات القسم
    const response = await fetch(`/api/pdfs/section/${sectionId}?t=${Date.now()}`);
    const data = await response.json();
    let allPDFs = data.success ? data.data : [];
    
    // ✅ إضافة الملف الجديد إذا لم يكن موجود
    const exists = allPDFs.some(pdf => pdf.id === newPDF.id);
    if (!exists) {
        allPDFs.unshift(newPDF); // في الأول
    }
    
    // عرض الملفات
    pdfsList.innerHTML = allPDFs.map(pdf => `
        <div style="background: ${pdf.id === newPDF.id ? '#e3f2fd' : '#f8f9fa'}; 
                    border: ${pdf.id === newPDF.id ? '2px solid #667eea' : '1px solid #e0e0e0'};">
            <div style="display: flex; gap: 15px;">
                <!-- صورة الغلاف أو أيقونة -->
                ${pdf.coverImage ? 
                    `<img src="${pdf.coverImage}" style="width: 80px; height: 110px;">` : 
                    `<div style="width: 80px; height: 110px; background: linear-gradient(135deg, #667eea, #764ba2);">
                        <i class="fas fa-file-pdf"></i>
                    </div>`
                }
                
                <!-- معلومات الملف -->
                <div style="flex: 1;">
                    <h4>${pdf.title} 
                        ${pdf.id === newPDF.id ? '<span style="background: #667eea; color: white;">جديد</span>' : ''}
                    </h4>
                    <p>${pdf.description}</p>
                    <div>
                        <span>${new Date(pdf.uploadedAt).toLocaleDateString('ar-EG')}</span>
                        <span>${(pdf.size / (1024 * 1024)).toFixed(2)} MB</span>
                    </div>
                </div>
                
                <!-- أزرار -->
                <div>
                    <button onclick="window.open('${pdf.path}', '_blank')">
                        <i class="fas fa-eye"></i> عرض
                    </button>
                    <a href="${pdf.path}" download>
                        <i class="fas fa-download"></i> تحميل
                    </a>
                    <button onclick="deletePDF(${pdf.id}, ${sectionId})">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}
```

---

# 👀 **3. عرض PDF للمستخدمين (pdf-viewer.html)**

## **الوصول:**
```
من dashboard.html:
window.location.href = `pdf-viewer.html?section=${encodeURIComponent(sectionTitle)}`;

مثال:
pdf-viewer.html?section=التشريح
```

## **تحميل الملفات:**

```javascript
// استخراج اسم القسم من URL
const urlParams = new URLSearchParams(window.location.search);
const currentSection = urlParams.get('section') || 'التشريح';

console.log('القسم الحالي:', currentSection);

// تحميل ملفات PDF
async function loadPDFFiles() {
    // حماية من الطلبات المتكررة
    if (isLoading) return;
    if (Date.now() - lastLoadTime < 1000) return;
    
    isLoading = true;
    lastLoadTime = Date.now();
    
    try {
        const response = await fetch(`/api/pdfs?section=${encodeURIComponent(currentSection)}`);
        const data = await response.json();
        
        if (data.success) {
            pdfFiles = data.data || [];
            console.log('✅ تم تحميل', pdfFiles.length, 'ملف');
            renderPDFFiles();
        }
    } finally {
        isLoading = false;
    }
}
```

## **عرض الملفات:**

```javascript
function renderPDFFiles() {
    const grid = document.getElementById('pdfGrid');
    
    if (pdfFiles.length === 0) {
        grid.innerHTML = `
            <div style="text-align: center; padding: 60px;">
                <i class="fas fa-folder-open" style="font-size: 5em; color: #ddd;"></i>
                <p>لا توجد ملفات PDF في هذا القسم</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = pdfFiles.map(pdf => `
        <div class="pdf-card" onclick="openPDF('${pdf.path}', ${pdf.id})">
            <!-- صورة الغلاف -->
            <div class="pdf-cover">
                ${pdf.coverImage ? 
                    `<img src="${pdf.coverImage}" alt="${pdf.title}">` :
                    `<div class="pdf-icon">
                        <i class="fas fa-file-pdf"></i>
                    </div>`
                }
                
                <!-- معلومات إضافية -->
                <div class="pdf-stats">
                    <span><i class="fas fa-eye"></i> ${pdf.views || 0}</span>
                    <span><i class="fas fa-download"></i> ${pdf.downloads || 0}</span>
                </div>
            </div>
            
            <!-- تفاصيل -->
            <div class="pdf-details">
                <h3>${pdf.title}</h3>
                <p>${pdf.description}</p>
                <div class="pdf-meta">
                    <span>${new Date(pdf.uploadedAt).toLocaleDateString('ar-EG')}</span>
                    <span>${(pdf.size / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
            </div>
            
            <!-- أزرار -->
            <div class="pdf-actions">
                <button onclick="openPDF('${pdf.path}', ${pdf.id}); event.stopPropagation();">
                    <i class="fas fa-eye"></i> عرض
                </button>
                <button onclick="downloadPDF('${pdf.path}', '${pdf.title}'); event.stopPropagation();">
                    <i class="fas fa-download"></i> تحميل
                </button>
                <button onclick="toggleFavorite(${pdf.id}); event.stopPropagation();">
                    <i class="fas fa-heart"></i> مفضلة
                </button>
            </div>
        </div>
    `).join('');
}
```

## **فتح PDF:**

```javascript
function openPDF(path, pdfId) {
    // زيادة عدد المشاهدات
    fetch(`/api/pdfs/${pdfId}/view`, { method: 'POST' });
    
    // فتح في tab جديد
    window.open(path, '_blank');
}

function downloadPDF(path, title) {
    // زيادة عدد التحميلات
    const pdfId = extractPdfId(path);
    fetch(`/api/pdfs/${pdfId}/download`, { method: 'POST' });
    
    // تحميل
    const a = document.createElement('a');
    a.href = path;
    a.download = title;
    a.click();
}
```

---

# 🔄 **4. Backend API (server.js)**

## **رفع ملف:**

```javascript
app.post('/api/upload-pdf', upload.fields([
    { name: 'pdf', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
]), (req, res) => {
    try {
        const pdfFile = req.files.pdf[0];
        const coverImageFile = req.files.coverImage?.[0];
        
        // إنشاء بيانات الملف
        const uniqueId = Date.now() + Math.floor(Math.random() * 1000);
        const pdfData = {
            id: uniqueId,
            filename: pdfFile.filename,
            originalName: pdfFile.originalname,
            path: `/uploads/${pdfFile.filename}`,
            size: pdfFile.size,
            sectionId: parseInt(req.body.sectionId),
            title: req.body.title || pdfFile.originalname,
            description: req.body.description || '',
            coverImage: coverImageFile ? `/uploads/${coverImageFile.filename}` : null,
            uploadedAt: new Date().toISOString(),
            downloads: 0,
            views: 0
        };
        
        // حفظ في pdfs.json
        let pdfs = JSON.parse(fs.readFileSync(PDFS_FILE, 'utf8'));
        pdfs.push(pdfData);
        fs.writeFileSync(PDFS_FILE, JSON.stringify(pdfs, null, 2));
        
        // تحديث cache
        pdfsCache = pdfs;
        cacheTimestamp.pdfs = Date.now();
        
        res.json({ success: true, data: pdfData });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
```

## **جلب ملفات قسم:**

```javascript
// للـ Admin - حسب ID
app.get('/api/pdfs/section/:sectionId', (req, res) => {
    try {
        const pdfs = JSON.parse(fs.readFileSync(PDFS_FILE, 'utf8'));
        const sectionId = parseInt(req.params.sectionId);
        const sectionPdfs = pdfs.filter(pdf => pdf.sectionId == sectionId);
        
        res.json({ success: true, data: sectionPdfs });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// للمستخدمين - حسب الاسم
app.get('/api/pdfs', (req, res) => {
    try {
        let pdfs = JSON.parse(fs.readFileSync(PDFS_FILE, 'utf8'));
        
        if (req.query.section) {
            const sections = JSON.parse(fs.readFileSync(SECTIONS_FILE, 'utf8'));
            const section = sections.find(s => s.title === req.query.section);
            
            if (section) {
                pdfs = pdfs.filter(pdf => pdf.sectionId == section.id);
            }
        }
        
        res.json({ success: true, data: pdfs });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
```

## **حذف ملف:**

```javascript
app.delete('/api/pdfs/:id', (req, res) => {
    try {
        let pdfs = JSON.parse(fs.readFileSync(PDFS_FILE, 'utf8'));
        const pdfId = parseInt(req.params.id);
        const pdfIndex = pdfs.findIndex(p => p.id == pdfId);
        
        if (pdfIndex !== -1) {
            const pdf = pdfs[pdfIndex];
            
            // حذف الملفات من uploads
            if (pdf.path) {
                const filePath = path.join(__dirname, pdf.path);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
            if (pdf.coverImage) {
                const coverPath = path.join(__dirname, pdf.coverImage);
                if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
            }
            
            // حذف من القائمة
            pdfs.splice(pdfIndex, 1);
            fs.writeFileSync(PDFS_FILE, JSON.stringify(pdfs, null, 2));
            
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false, error: 'PDF not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
```

---

# 📊 **5. هيكل البيانات (pdfs.json)**

```json
[
  {
    "id": 1733304417414,
    "filename": "1733304417414-531376032.pdf",
    "originalName": "anatomy-basics.pdf",
    "path": "/uploads/1733304417414-531376032.pdf",
    "size": 2458624,
    "sectionId": 1,
    "title": "أساسيات التشريح",
    "description": "مقدمة شاملة لعلم التشريح البشري",
    "coverImage": "/uploads/1733304417414-cover.jpg",
    "uploadedAt": "2025-10-04T09:10:17.414Z",
    "downloads": 45,
    "views": 128
  }
]
```

---

# 🔥 **6. الميزات:**

## **أ. Progress Bar الحقيقي:**
```
- نسبة التقدم (0-100%)
- MB المرفوع / الإجمالي
- سرعة الرفع
- الوقت المتبقي
- Animation جميل
```

## **ب. عرض فوري (Zero Delay):**
```
- استخدام data.data المُرجع
- بدون انتظار
- الملف يظهر فوراً
- Badge "جديد"
- Animation slideIn
```

## **ج. تحديثات تلقائية:**
```
- Auto-refresh كل 5 ثواني (pdf-viewer.html)
- Loading Guard (منع spam)
- Cooldown 1 ثانية
```

## **د. إحصائيات:**
```
- عدد المشاهدات
- عدد التحميلات
- تاريخ الرفع
- حجم الملف
```

---

# 📂 **7. مسار الملفات:**

```
/uploads/
├── 1733304417414-531376032.pdf     ← ملف PDF
├── 1733304417414-cover.jpg         ← صورة الغلاف
├── 1733304528923-184726531.pdf
└── ...

/data/
├── pdfs.json      ← قاعدة بيانات PDF
├── sections.json  ← الأقسام
└── users.json     ← المستخدمين
```

---

# 🎯 **الخلاصة:**

```
1. المشرف يرفع في: admin-backend.html
2. يُحفظ في: /uploads + pdfs.json
3. المستخدم يشوف في: pdf-viewer.html
4. API يربط كل شيء: server.js

⚡ بدون تأخير
⚡ Progress Bar حقيقي
⚡ تحديثات تلقائية
⚡ احترافي 100%
```

---

**📁 الملفات المهمة:**
- `admin-backend.html` (سطر 1000-1300)
- `pdf-viewer.html` (سطر 950-1100)
- `server.js` (سطر 550-750)
