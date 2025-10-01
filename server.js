const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3000;

// إنشاء مجلدات التخزين إذا لم تكن موجودة
const uploadsDir = path.join(__dirname, 'uploads');
const dataDir = path.join(__dirname, 'data');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// ملفات البيانات
const SECTIONS_FILE = path.join(dataDir, 'sections.json');
const USERS_FILE = path.join(dataDir, 'users.json');
const PDFS_FILE = path.join(dataDir, 'pdfs.json');

// تهيئة ملفات البيانات إذا لم تكن موجودة
if (!fs.existsSync(SECTIONS_FILE)) {
    fs.writeFileSync(SECTIONS_FILE, JSON.stringify([
        {
            id: 1,
            title: "التشريح",
            description: "تعلم أساسيات التشريح البشري والأعضاء المختلفة",
            icon: "🫀",
            views: 0
        },
        {
            id: 2,
            title: "أساسيات التمريض",
            description: "المبادئ الأساسية للتمريض ورعاية المرضى",
            icon: "👩‍⚕️",
            views: 0
        },
        {
            id: 3,
            title: "الأدوية",
            description: "معرفة الأدوية المختلفة وطرق استخدامها",
            icon: "💊",
            views: 0
        },
        {
            id: 4,
            title: "الطوارئ",
            description: "التعامل مع الحالات الطارئة والإسعافات الأولية",
            icon: "🚑",
            views: 0
        }
    ], null, 2));
}

if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
}

if (!fs.existsSync(PDFS_FILE)) {
    fs.writeFileSync(PDFS_FILE, JSON.stringify([], null, 2));
}

// إعدادات Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// تقديم الملفات الثابتة
app.use(express.static(__dirname));
app.use('/uploads', express.static(uploadsDir));

// إعدادات Multer لرفع الملفات
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: function (req, file, cb) {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('يجب أن يكون الملف من نوع PDF فقط!'));
        }
    }
});

// ================== API Endpoints ==================

// الصفحة الرئيسية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ========== الأقسام (Sections) ==========

// الحصول على جميع الأقسام
app.get('/api/sections', (req, res) => {
    try {
        const sections = JSON.parse(fs.readFileSync(SECTIONS_FILE, 'utf8'));
        res.json({ success: true, data: sections });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// إضافة قسم جديد
app.post('/api/sections', (req, res) => {
    try {
        const sections = JSON.parse(fs.readFileSync(SECTIONS_FILE, 'utf8'));
        const newSection = {
            id: Date.now(),
            title: req.body.title,
            description: req.body.description,
            icon: req.body.icon,
            views: 0
        };
        sections.push(newSection);
        fs.writeFileSync(SECTIONS_FILE, JSON.stringify(sections, null, 2));
        res.json({ success: true, data: newSection });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// تعديل قسم
app.put('/api/sections/:id', (req, res) => {
    try {
        const sections = JSON.parse(fs.readFileSync(SECTIONS_FILE, 'utf8'));
        const index = sections.findIndex(s => s.id == req.params.id);
        if (index !== -1) {
            sections[index] = { ...sections[index], ...req.body };
            fs.writeFileSync(SECTIONS_FILE, JSON.stringify(sections, null, 2));
            res.json({ success: true, data: sections[index] });
        } else {
            res.status(404).json({ success: false, error: 'القسم غير موجود' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// حذف قسم
app.delete('/api/sections/:id', (req, res) => {
    try {
        let sections = JSON.parse(fs.readFileSync(SECTIONS_FILE, 'utf8'));
        sections = sections.filter(s => s.id != req.params.id);
        fs.writeFileSync(SECTIONS_FILE, JSON.stringify(sections, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========== المستخدمين (Users) ==========

// الحصول على جميع المستخدمين
app.get('/api/users', (req, res) => {
    try {
        const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// إضافة مستخدم جديد
app.post('/api/users', (req, res) => {
    try {
        const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        const newUser = {
            id: Date.now(),
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            registeredAt: new Date().toISOString()
        };
        users.push(newUser);
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
        res.json({ success: true, data: newUser });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// تسجيل الدخول
app.post('/api/login', (req, res) => {
    try {
        const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        const user = users.find(u => u.email === req.body.email && u.password === req.body.password);
        if (user) {
            res.json({ success: true, data: user });
        } else {
            res.status(401).json({ success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========== ملفات PDF ==========

// الحصول على جميع ملفات PDF
app.get('/api/pdfs', (req, res) => {
    try {
        const pdfs = JSON.parse(fs.readFileSync(PDFS_FILE, 'utf8'));
        res.json({ success: true, data: pdfs });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// الحصول على ملفات PDF حسب القسم
app.get('/api/pdfs/section/:sectionId', (req, res) => {
    try {
        const pdfs = JSON.parse(fs.readFileSync(PDFS_FILE, 'utf8'));
        const sectionPdfs = pdfs.filter(pdf => pdf.sectionId == req.params.sectionId);
        res.json({ success: true, data: sectionPdfs });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// رفع ملف PDF جديد
app.post('/api/pdfs/upload', upload.single('pdfFile'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'لم يتم رفع أي ملف' });
        }

        const pdfs = JSON.parse(fs.readFileSync(PDFS_FILE, 'utf8'));
        const newPdf = {
            id: Date.now(),
            sectionId: req.body.sectionId,
            section: req.body.section,
            title: req.body.title,
            description: req.body.description,
            filename: req.file.originalname,
            savedFilename: req.file.filename,
            path: `/uploads/${req.file.filename}`,
            size: (req.file.size / 1024 / 1024).toFixed(2) + ' MB',
            pages: 0,
            views: 0,
            uploadDate: new Date().toLocaleDateString('ar-SA')
        };

        pdfs.push(newPdf);
        fs.writeFileSync(PDFS_FILE, JSON.stringify(pdfs, null, 2));
        res.json({ success: true, data: newPdf });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// حذف ملف PDF
app.delete('/api/pdfs/:id', (req, res) => {
    try {
        let pdfs = JSON.parse(fs.readFileSync(PDFS_FILE, 'utf8'));
        const pdf = pdfs.find(p => p.id == req.params.id);
        
        if (pdf) {
            // حذف الملف من المجلد
            const filePath = path.join(__dirname, 'uploads', pdf.savedFilename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        
        pdfs = pdfs.filter(p => p.id != req.params.id);
        fs.writeFileSync(PDFS_FILE, JSON.stringify(pdfs, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// زيادة عدد المشاهدات لملف PDF
app.post('/api/pdfs/:id/view', (req, res) => {
    try {
        const pdfs = JSON.parse(fs.readFileSync(PDFS_FILE, 'utf8'));
        const index = pdfs.findIndex(p => p.id == req.params.id);
        if (index !== -1) {
            pdfs[index].views = (pdfs[index].views || 0) + 1;
            fs.writeFileSync(PDFS_FILE, JSON.stringify(pdfs, null, 2));
            res.json({ success: true, views: pdfs[index].views });
        } else {
            res.status(404).json({ success: false, error: 'الملف غير موجود' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========== الإحصائيات ==========

app.get('/api/stats', (req, res) => {
    try {
        const sections = JSON.parse(fs.readFileSync(SECTIONS_FILE, 'utf8'));
        const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        const pdfs = JSON.parse(fs.readFileSync(PDFS_FILE, 'utf8'));

        let totalViews = 0;
        sections.forEach(section => {
            totalViews += section.views || 0;
        });
        pdfs.forEach(pdf => {
            totalViews += pdf.views || 0;
        });

        res.json({
            success: true,
            data: {
                totalUsers: users.length,
                totalSections: sections.length,
                totalPDFs: pdfs.length,
                totalViews: totalViews
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========== معالجة الأخطاء ==========

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        error: err.message || 'حدث خطأ في السيرفر' 
    });
});

// ========== تشغيل السيرفر ==========

app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════╗
║   🎉 السيرفر يعمل بنجاح!            ║
║                                      ║
║   🌐 http://localhost:${PORT}         ║
║                                      ║
║   📚 الأقسام: /api/sections         ║
║   👥 المستخدمين: /api/users         ║
║   📄 ملفات PDF: /api/pdfs           ║
║   📊 الإحصائيات: /api/stats         ║
╚══════════════════════════════════════╝
    `);
});
