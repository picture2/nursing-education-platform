# 📤 **كيف يتم رفع وعرض PDF - شرح بسيط**

## 📂 **الملفات:**

```
admin-backend.html  → رفع PDF (المشرف)
pdf-viewer.html     → عرض PDF (المستخدمين)
server.js           → Backend
data/pdfs.json      → قاعدة البيانات
```

---

## 1️⃣ **رفع PDF (admin-backend.html)**

### **الكود الأساسي:**

```javascript
// عند الضغط على "رفع ملف"
async function confirmUploadPDF() {
    // 1. جمع البيانات
    const file = document.getElementById('pdfFileInput').files[0];
    const title = document.getElementById('pdfTitle').value;
    const description = document.getElementById('pdfDescription').value;
    const sectionId = document.getElementById('pdfSectionId').value;
    
    // 2. إنشاء FormData
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('sectionId', sectionId);
    formData.append('title', title);
    formData.append('description', description);
    
    // 3. رفع للسيرفر مع Progress Bar
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', function(e) {
        const percent = Math.round((e.loaded / e.total) * 100);
        document.getElementById('uploadProgressBar').style.width = percent + '%';
    });
    
    xhr.open('POST', '/api/upload-pdf');
    xhr.send(formData);
    
    // 4. بعد الرفع - عرض فوراً
    xhr.onload = function() {
        const data = JSON.parse(xhr.responseText);
        if (data.success) {
            // عرض الملف الجديد فوراً
            viewSectionPDFsWithNewFile(sectionId, sectionTitle, data.data);
        }
    };
}
```

---

## 2️⃣ **عرض PDF في Admin (admin-backend.html)**

```javascript
// عرض الملف الجديد فوراً
window.viewSectionPDFsWithNewFile = async function(sectionId, sectionTitle, newPDF) {
    // فتح Modal
    document.getElementById('viewPDFsModal').style.display = 'flex';
    
    // جلب جميع الملفات
    const response = await fetch(`/api/pdfs/section/${sectionId}`);
    const data = await response.json();
    let allPDFs = data.data;
    
    // إضافة الملف الجديد في الأول
    if (!allPDFs.some(pdf => pdf.id === newPDF.id)) {
        allPDFs.unshift(newPDF);
    }
    
    // عرض
    document.getElementById('pdfsList').innerHTML = allPDFs.map(pdf => `
        <div class="pdf-item">
            <img src="${pdf.coverImage || 'default-cover.jpg'}">
            <h4>${pdf.title}</h4>
            <p>${pdf.description}</p>
            <button onclick="window.open('${pdf.path}')">عرض</button>
            <button onclick="deletePDF(${pdf.id})">حذف</button>
        </div>
    `).join('');
}
```

---

## 3️⃣ **عرض PDF للمستخدمين (pdf-viewer.html)**

```javascript
// URL مثل: pdf-viewer.html?section=التشريح
const sectionName = new URLSearchParams(window.location.search).get('section');

// تحميل ملفات القسم
async function loadPDFFiles() {
    const response = await fetch(`/api/pdfs?section=${encodeURIComponent(sectionName)}`);
    const data = await response.json();
    
    const pdfFiles = data.data || [];
    
    // عرض
    document.getElementById('pdfGrid').innerHTML = pdfFiles.map(pdf => `
        <div class="pdf-card" onclick="window.open('${pdf.path}')">
            <img src="${pdf.coverImage || 'default.jpg'}">
            <h3>${pdf.title}</h3>
            <p>${pdf.description}</p>
            <div class="stats">
                <span>👁️ ${pdf.views}</span>
                <span>⬇️ ${pdf.downloads}</span>
            </div>
            <button>عرض PDF</button>
        </div>
    `).join('');
}

// تحديث تلقائي كل 5 ثواني
setInterval(loadPDFFiles, 5000);
```

---

## 4️⃣ **Backend (server.js)**

### **رفع ملف:**
```javascript
app.post('/api/upload-pdf', upload.single('pdf'), (req, res) => {
    // إنشاء بيانات الملف
    const pdfData = {
        id: Date.now(),
        path: `/uploads/${req.file.filename}`,
        sectionId: parseInt(req.body.sectionId),
        title: req.body.title,
        description: req.body.description,
        uploadedAt: new Date().toISOString(),
        views: 0,
        downloads: 0
    };
    
    // حفظ في pdfs.json
    const pdfs = JSON.parse(fs.readFileSync('data/pdfs.json'));
    pdfs.push(pdfData);
    fs.writeFileSync('data/pdfs.json', JSON.stringify(pdfs, null, 2));
    
    res.json({ success: true, data: pdfData });
});
```

### **جلب ملفات:**
```javascript
// للـ Admin (حسب ID)
app.get('/api/pdfs/section/:sectionId', (req, res) => {
    const pdfs = JSON.parse(fs.readFileSync('data/pdfs.json'));
    const filtered = pdfs.filter(pdf => pdf.sectionId == req.params.sectionId);
    res.json({ success: true, data: filtered });
});

// للمستخدمين (حسب الاسم)
app.get('/api/pdfs', (req, res) => {
    const pdfs = JSON.parse(fs.readFileSync('data/pdfs.json'));
    const sections = JSON.parse(fs.readFileSync('data/sections.json'));
    
    const section = sections.find(s => s.title === req.query.section);
    const filtered = pdfs.filter(pdf => pdf.sectionId == section.id);
    
    res.json({ success: true, data: filtered });
});
```

---

## 5️⃣ **pdfs.json - البيانات:**

```json
[
  {
    "id": 1733304417414,
    "path": "/uploads/1733304417414-anatomy.pdf",
    "sectionId": 1,
    "title": "أساسيات التشريح",
    "description": "مقدمة شاملة",
    "coverImage": "/uploads/1733304417414-cover.jpg",
    "uploadedAt": "2025-10-04T12:10:17.414Z",
    "views": 128,
    "downloads": 45
  }
]
```

---

## 🔥 **الميزات الإضافية:**

### **Progress Bar حقيقي:**
```javascript
xhr.upload.addEventListener('progress', function(e) {
    const percent = (e.loaded / e.total) * 100;
    const uploadedMB = e.loaded / (1024 * 1024);
    const totalMB = e.total / (1024 * 1024);
    const speed = e.loaded / ((Date.now() - startTime) / 1000);
    const remainingTime = (e.total - e.loaded) / speed;
    
    // تحديث UI
    progressBar.style.width = percent + '%';
    progressText.textContent = `${uploadedMB.toFixed(2)} / ${totalMB.toFixed(2)} MB`;
    timeText.textContent = `${remainingTime.toFixed(0)} ثانية متبقية`;
});
```

### **عرض فوري بدون تأخير:**
```javascript
// استخدام البيانات المُرجعة من السيرفر مباشرة
if (data.success) {
    viewSectionPDFsWithNewFile(sectionId, sectionTitle, data.data);
    // ← الملف يظهر فوراً بدون انتظار!
}
```

### **Loading Guard (منع Spam):**
```javascript
let isLoading = false;
let lastLoadTime = 0;

async function loadPDFFiles() {
    if (isLoading) return;  // منع التحميل المتزامن
    if (Date.now() - lastLoadTime < 1000) return;  // Cooldown
    
    isLoading = true;
    lastLoadTime = Date.now();
    
    try {
        // تحميل...
    } finally {
        isLoading = false;
    }
}
```

---

## 📊 **الخلاصة:**

```
1. المشرف يرفع ملف:
   admin-backend.html → /api/upload-pdf → pdfs.json

2. الملف يُحفظ في:
   /uploads/[timestamp]-[filename].pdf

3. المستخدم يشوف:
   pdf-viewer.html → /api/pdfs?section=XXX → عرض

4. كل شيء يعمل بدون تأخير وبشكل احترافي!
```

---

**🎯 الملفات المهمة:**
- `admin-backend.html` - سطر 1000-1300 (رفع)
- `pdf-viewer.html` - سطر 950-1100 (عرض)
- `server.js` - سطر 550-750 (API)
