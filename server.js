const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// دالة للـ logging تعمل فقط في development
const log = (...args) => {
    if (!IS_PRODUCTION) {
        console.log(...args);
    }
};

// Cache للبيانات المقروءة لتحسين الأداء
let sectionsCache = null;
let usersCache = null;
let pdfsCache = null;
let cacheTimestamp = {
    sections: 0,
    users: 0,
    pdfs: 0
};
const CACHE_DURATION = 60000; // 1 دقيقة

// دالة لقراءة البيانات مع Cache
function readWithCache(file, cacheKey) {
    const now = Date.now();
    if (cacheKey === 'sections' && sectionsCache && (now - cacheTimestamp.sections < CACHE_DURATION)) {
        return sectionsCache;
    }
    if (cacheKey === 'users' && usersCache && (now - cacheTimestamp.users < CACHE_DURATION)) {
        return usersCache;
    }
    if (cacheKey === 'pdfs' && pdfsCache && (now - cacheTimestamp.pdfs < CACHE_DURATION)) {
        return pdfsCache;
    }

    const data = JSON.parse(fs.readFileSync(file, 'utf8'));

    if (cacheKey === 'sections') {
        sectionsCache = data;
        cacheTimestamp.sections = now;
    } else if (cacheKey === 'users') {
        usersCache = data;
        cacheTimestamp.users = now;
    } else if (cacheKey === 'pdfs') {
        pdfsCache = data;
        cacheTimestamp.pdfs = now;
    }

    return data;
}

// دالة لكتابة البيانات وتحديث Cache
function writeWithCache(file, data, cacheKey) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));

    if (cacheKey === 'sections') {
        sectionsCache = data;
        cacheTimestamp.sections = Date.now();
    } else if (cacheKey === 'users') {
        usersCache = data;
        cacheTimestamp.users = Date.now();
    } else if (cacheKey === 'pdfs') {
        pdfsCache = data;
        cacheTimestamp.pdfs = Date.now();
    }
}

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
const BANNED_DEVICES_FILE = path.join(dataDir, 'banned-devices.json');
const MESSAGES_FILE = path.join(dataDir, 'messages.json');

// تهيئة ملفات البيانات إذا لم تكن موجودة
if (!fs.existsSync(SECTIONS_FILE)) {
    fs.writeFileSync(SECTIONS_FILE, JSON.stringify([{
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

if (!fs.existsSync(BANNED_DEVICES_FILE)) {
    fs.writeFileSync(BANNED_DEVICES_FILE, JSON.stringify([], null, 2));
}

if (!fs.existsSync(MESSAGES_FILE)) {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify([], null, 2));
}

// إعدادات Middleware
app.use(compression()); // ضغط الاستجابات لتحسين السرعة
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// تقديم الملفات الثابتة
app.use(express.static(__dirname));
app.use('/uploads', express.static(uploadsDir));
app.use('/models', express.static(path.join(__dirname, 'models')));
app.use('/environments', express.static(path.join(__dirname, 'environments')));

// إعدادات Multer لرفع الملفات
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
    fileFilter: function(req, file, cb) {
        // قبول PDF والصور
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('يجب أن يكون الملف من نوع PDF أو صورة!'));
        }
    }
});

// ================== API Endpoints ==================

// الصفحة الرئيسية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ========== الأقسام (Sections) ==========

// الحصول على جميع الأقسام (مع Cache)
app.get('/api/sections', (req, res) => {
    try {
        let sections = readWithCache(SECTIONS_FILE, 'sections');

        // تنظيف تلقائي: إرجاع الأقسام الصحيحة فقط
        const validSections = sections.filter(s => s.title && s.description);

        // إذا كان هناك أقسام فاسدة، نظّف الملف
        if (validSections.length !== sections.length) {
            console.log(`🧹 تنظيف تلقائي: حذف ${sections.length - validSections.length} قسم فاسد`);
            fs.writeFileSync(SECTIONS_FILE, JSON.stringify(validSections, null, 2));
            sectionsCache = validSections;
            cacheTimestamp.sections = Date.now();
            sections = validSections;
        }

        res.json({ success: true, data: sections });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// إضافة قسم جديد (مع صورة)
app.post('/api/sections', upload.single('image'), (req, res) => {
    try {
        console.log('\n=== 📥 طلب إضافة قسم جديد ===');
        console.log('📝 Body:', JSON.stringify(req.body, null, 2));
        console.log('📷 File:', req.file ? req.file.filename : 'لا توجد صورة');

        // Validation صارم جداً
        const title = req.body.title ? req.body.title.trim() : '';
        const description = req.body.description ? req.body.description.trim() : '';

        console.log(`🔍 Title length: ${title.length}, Description length: ${description.length}`);

        if (!title || title.length < 2) {
            console.log('❌ الاسم فارغ أو قصير جداً');
            return res.status(400).json({
                success: false,
                error: 'يجب إدخال اسم القسم (على الأقل حرفان)'
            });
        }

        if (!description || description.length < 5) {
            console.log('❌ الوصف فارغ أو قصير جداً');
            return res.status(400).json({
                success: false,
                error: 'يجب إدخال وصف القسم (على الأقل 5 أحرف)'
            });
        }

        // قراءة مباشرة من الملف
        let sections = JSON.parse(fs.readFileSync(SECTIONS_FILE, 'utf8'));

        // تنظيف تلقائي: حذف أي أقسام فاسدة
        const validSections = sections.filter(s => s.title && s.description);
        if (validSections.length !== sections.length) {
            console.log(`🧹 تنظيف: حذف ${sections.length - validSections.length} قسم فاسد`);
            sections = validSections;
        }

        console.log(`📊 عدد الأقسام الحالية: ${sections.length}`);

        const newSection = {
            id: Date.now(),
            title: title,
            description: description,
            image: req.file ? `/uploads/${req.file.filename}` : null,
            icon: req.body.icon || '📚',
            views: 0
        };

        // التأكد من أن القسم صحيح قبل الإضافة
        if (!newSection.title || !newSection.description) {
            console.log('❌ فشل إنشاء القسم - بيانات ناقصة');
            return res.status(400).json({
                success: false,
                error: 'خطأ في إنشاء القسم'
            });
        }

        sections.push(newSection);

        // كتابة مباشرة وتحديث Cache
        fs.writeFileSync(SECTIONS_FILE, JSON.stringify(sections, null, 2));
        sectionsCache = sections;
        cacheTimestamp.sections = Date.now();

        console.log(`✅ إضافة قسم: "${newSection.title}" (ID: ${newSection.id})`);
        console.log(`📊 إجمالي الأقسام الآن: ${sections.length}`);
        console.log('=== ✅ انتهى الطلب ===\n');

        res.json({ success: true, data: newSection, message: 'تم إضافة القسم بنجاح' });
    } catch (error) {
        console.error('❌ خطأ في إضافة قسم:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// تعديل قسم
app.put('/api/sections/:id', (req, res) => {
    try {
        const sections = JSON.parse(fs.readFileSync(SECTIONS_FILE, 'utf8'));
        const index = sections.findIndex(s => s.id == req.params.id);
        if (index !== -1) {
            sections[index] = {...sections[index], ...req.body };
            writeWithCache(SECTIONS_FILE, sections, 'sections'); // تحديث Cache
            res.json({ success: true, data: sections[index] });
        } else {
            res.status(404).json({ success: false, error: 'القسم غير موجود' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// حذف قسم (مع كل PDFs التابعة له)
app.delete('/api/sections/:id', (req, res) => {
    try {
        const sectionId = parseInt(req.params.id);
        console.log(`\n========== 🗑️ حذف القسم: ${sectionId} ==========`);

        // 1. قراءة مباشرة من الملف (تجاهل cache)
        let sections = JSON.parse(fs.readFileSync(SECTIONS_FILE, 'utf8'));
        console.log(`📊 عدد الأقسام قبل الحذف: ${sections.length}`);

        const beforeLength = sections.length;
        const sectionToDelete = sections.find(s => s.id == sectionId);

        if (!sectionToDelete) {
            console.log(`❌ القسم ${sectionId} غير موجود`);
            return res.status(404).json({ success: false, error: 'القسم غير موجود' });
        }

        console.log(`📂 القسم المراد حذفه: ${sectionToDelete.title}`);

        // 2. قراءة كل PDFs
        let pdfs = [];
        try {
            pdfs = JSON.parse(fs.readFileSync(PDFS_FILE, 'utf8'));
        } catch (e) {
            console.log('⚠️ ملف PDFs فارغ أو غير موجود');
            pdfs = [];
        }

        // 3. البحث عن PDFs التابعة لهذا القسم
        const pdfsToDelete = pdfs.filter(pdf => pdf.sectionId === sectionId);
        console.log(`📄 عدد الملفات التابعة للقسم: ${pdfsToDelete.length}`);

        // 4. حذف ملفات PDF الفعلية من /uploads/
        let deletedFilesCount = 0;
        pdfsToDelete.forEach(pdf => {
            try {
                const filePath = path.join(__dirname, 'uploads', pdf.filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`✅ تم حذف الملف: ${pdf.filename}`);
                    deletedFilesCount++;
                } else {
                    console.log(`⚠️ الملف غير موجود: ${pdf.filename}`);
                }

                // حذف صورة الغلاف إن وجدت
                if (pdf.coverImage) {
                    const coverPath = path.join(__dirname, pdf.coverImage.replace('/uploads/', 'uploads/'));
                    if (fs.existsSync(coverPath)) {
                        fs.unlinkSync(coverPath);
                        console.log(`✅ تم حذف صورة الغلاف: ${pdf.coverImage}`);
                    }
                }
            } catch (err) {
                console.error(`❌ خطأ في حذف الملف ${pdf.filename}:`, err.message);
            }
        });

        // 5. حذف سجلات PDF من pdfs.json
        const remainingPDFs = pdfs.filter(pdf => pdf.sectionId !== sectionId);
        fs.writeFileSync(PDFS_FILE, JSON.stringify(remainingPDFs, null, 2));
        pdfsCache = remainingPDFs;
        cacheTimestamp.pdfs = Date.now();

        console.log(`📚 عدد PDFs قبل الحذف: ${pdfs.length}`);
        console.log(`📚 عدد PDFs بعد الحذف: ${remainingPDFs.length}`);

        // 6. حذف القسم من sections.json
        sections = sections.filter(s => s.id !== sectionId);
        fs.writeFileSync(SECTIONS_FILE, JSON.stringify(sections, null, 2));
        sectionsCache = sections;
        cacheTimestamp.sections = Date.now();

        console.log(`📊 عدد الأقسام بعد الحذف: ${sections.length}`);

        // 7. ملخص العملية
        console.log(`\n✅ ملخص الحذف:`);
        console.log(`   - القسم: ${sectionToDelete.title}`);
        console.log(`   - عدد PDFs المحذوفة: ${pdfsToDelete.length}`);
        console.log(`   - عدد الملفات الفعلية المحذوفة: ${deletedFilesCount}`);
        console.log(`========================================\n`);

        res.json({
            success: true,
            message: `تم حذف القسم "${sectionToDelete.title}" وجميع الملفات التابعة له (${pdfsToDelete.length} ملف)`,
            deletedSection: sectionToDelete.title,
            deletedPDFsCount: pdfsToDelete.length,
            deletedFilesCount: deletedFilesCount,
            remainingSections: sections.length
        });
    } catch (error) {
        console.error('❌ خطأ في حذف القسم:', error);
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

// تسجيل مستخدم جديد (Sign Up)
app.post('/api/signup', (req, res) => {
    try {
        // التحقق من حظر الجهاز أولاً
        const deviceId = req.body.deviceId || req.body.deviceFingerprint;
        if (deviceId) {
            let bannedDevices = [];
            if (fs.existsSync(BANNED_DEVICES_FILE)) {
                bannedDevices = JSON.parse(fs.readFileSync(BANNED_DEVICES_FILE, 'utf8'));
            }

            if (bannedDevices.includes(deviceId)) {
                log(`🚫 محاولة تسجيل من جهاز محظور: ${deviceId}`);
                return res.status(403).json({
                    success: false,
                    error: 'جهازك محظور من قبل الإدارة. لا يمكنك إنشاء حساب جديد من هذا الجهاز.'
                });
            }
        }

        const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));

        // التحقق من وجود البريد الإلكتروني
        const existingUser = users.find(u => u.email.toLowerCase() === req.body.email.toLowerCase());
        if (existingUser) {
            return res.status(400).json({ success: false, error: 'البريد الإلكتروني مستخدم بالفعل' });
        }

        // إنشاء مستخدم جديد
        const newUser = {
            id: Date.now(),
            name: req.body.name,
            email: req.body.email.toLowerCase(),
            password: req.body.password, // في الإنتاج، يجب تشفير كلمة المرور
            registeredAt: new Date().toISOString(),
            lastLogin: null,
            isActive: true, // مفعّل افتراضياً
            deviceId: deviceId || null
        };

        users.push(newUser);
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

        log(`✅ تسجيل مستخدم جديد: ${newUser.email}`);
        res.json({ success: true, data: { id: newUser.id, name: newUser.name, email: newUser.email } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// تسجيل الدخول
app.post('/api/login', (req, res) => {
    try {
        // التحقق من حظر الجهاز أولاً
        const deviceId = req.body.deviceId || req.body.deviceFingerprint;
        if (deviceId) {
            let bannedDevices = [];
            if (fs.existsSync(BANNED_DEVICES_FILE)) {
                bannedDevices = JSON.parse(fs.readFileSync(BANNED_DEVICES_FILE, 'utf8'));
            }

            if (bannedDevices.includes(deviceId)) {
                log(`🚫 محاولة تسجيل دخول من جهاز محظور: ${req.body.email}`);
                return res.status(403).json({
                    success: false,
                    error: 'جهازك محظور من قبل الإدارة. لا يمكنك تسجيل الدخول من هذا الجهاز.'
                });
            }
        }

        const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        const user = users.find(u => u.email.toLowerCase() === req.body.email.toLowerCase() && u.password === req.body.password);
        if (user) {
            // التحقق من أن الحساب مفعّل
            if (user.isActive === false) {
                return res.status(403).json({ success: false, error: 'تم إيقاف حسابك من قبل المشرف. الرجاء التواصل مع الإدارة.' });
            }

            // تحديث آخر تسجيل دخول
            const userIndex = users.findIndex(u => u.id === user.id);
            users[userIndex].lastLogin = new Date().toISOString();
            fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

            res.json({ success: true, data: { id: user.id, name: user.name, email: user.email } });
        } else {
            res.status(401).json({ success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// تفعيل/إيقاف مستخدم (للأدمن فقط)
app.put('/api/users/:id/toggle-status', (req, res) => {
    try {
        const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        const userIndex = users.findIndex(u => u.id == req.params.id);

        if (userIndex === -1) {
            return res.status(404).json({ success: false, error: 'المستخدم غير موجود' });
        }

        const user = users[userIndex];
        const deviceId = user.deviceId || user.deviceFingerprint;

        // عكس الحالة
        users[userIndex].isActive = !users[userIndex].isActive;
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

        // حظر/فك حظر الجهاز
        if (deviceId) {
            let bannedDevices = [];
            if (fs.existsSync(BANNED_DEVICES_FILE)) {
                bannedDevices = JSON.parse(fs.readFileSync(BANNED_DEVICES_FILE, 'utf8'));
            }

            if (!users[userIndex].isActive) {
                // حظر الجهاز
                if (!bannedDevices.includes(deviceId)) {
                    bannedDevices.push(deviceId);
                    fs.writeFileSync(BANNED_DEVICES_FILE, JSON.stringify(bannedDevices, null, 2));
                    log(`🚫 تم حظر جهاز المستخدم: ${user.email} - Device: ${deviceId}`);
                }
            } else {
                // فك حظر الجهاز
                const index = bannedDevices.indexOf(deviceId);
                if (index > -1) {
                    bannedDevices.splice(index, 1);
                    fs.writeFileSync(BANNED_DEVICES_FILE, JSON.stringify(bannedDevices, null, 2));
                    log(`✅ تم فك حظر جهاز المستخدم: ${user.email} - Device: ${deviceId}`);
                }
            }
        }

        res.json({
            success: true,
            data: {
                id: users[userIndex].id,
                isActive: users[userIndex].isActive
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========== حظر الأجهزة ==========

// التحقق من أن الجهاز محظور
app.post('/api/check-device', (req, res) => {
    try {
        const deviceId = req.body.deviceId;
        let bannedDevices = [];
        if (fs.existsSync(BANNED_DEVICES_FILE)) {
            bannedDevices = JSON.parse(fs.readFileSync(BANNED_DEVICES_FILE, 'utf8'));
        }

        // دعم النوعين: string array أو object array (للتوافق القديم)
        const isBanned = Array.isArray(bannedDevices) ?
            bannedDevices.includes(deviceId) || bannedDevices.some(d => d && d.deviceId === deviceId) :
            false;

        if (isBanned) {
            return res.json({
                success: false,
                banned: true,
                message: 'تم حظر جهازك من قبل المشرف. يرجى التواصل مع الإدارة لفك الحظر.'
            });
        }

        res.json({ success: true, banned: false });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// APIs القديمة محذوفة - استخدم الجديدة في نهاية الملف

// ========== ملفات PDF ==========

// الحصول على جميع ملفات PDF (مع دعم filter حسب القسم)
app.get('/api/pdfs', (req, res) => {
    try {
        let pdfs = JSON.parse(fs.readFileSync(PDFS_FILE, 'utf8'));

        // إذا كان في query parameter للقسم
        if (req.query.section) {
            // Logging مختصر (تجنب console spam)
            // console.log('🔍 فلترة PDFs للقسم:', req.query.section);

            // جلب الأقسام للحصول على الـ ID
            const sections = JSON.parse(fs.readFileSync(SECTIONS_FILE, 'utf8'));
            const section = sections.find(s => s.title === req.query.section);

            if (section) {
                // console.log('✅ تم إيجاد القسم - ID:', section.id);
                pdfs = pdfs.filter(pdf => pdf.sectionId == section.id);
                // console.log('📄 عدد ملفات PDF:', pdfs.length);
            } else {
                console.log('❌ القسم غير موجود:', req.query.section);
                pdfs = [];
            }
        }

        res.json({ success: true, data: pdfs });
    } catch (error) {
        console.error('❌ خطأ:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// الحصول على ملفات PDF حسب القسم
app.get('/api/pdfs/section/:sectionId', (req, res) => {
    try {
        console.log('🔍 طلب ملفات القسم:', req.params.sectionId);

        // قراءة الملف مباشرة بدون cache
        const pdfs = JSON.parse(fs.readFileSync(PDFS_FILE, 'utf8'));
        console.log('📁 إجمالي الملفات:', pdfs.length);

        // تحويل sectionId لـ number للمقارنة
        const requestedSectionId = parseInt(req.params.sectionId);
        console.log('🎯 البحث عن sectionId:', requestedSectionId);

        // فلترة الملفات
        const sectionPdfs = pdfs.filter(pdf => {
            console.log(`   - PDF ${pdf.id}: sectionId=${pdf.sectionId}, match=${pdf.sectionId == requestedSectionId}`);
            return pdf.sectionId == requestedSectionId;
        });

        console.log('✅ تم إيجاد', sectionPdfs.length, 'ملفات');

        res.json({ success: true, data: sectionPdfs });
    } catch (error) {
        console.error('❌ خطأ:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// API قديم - محذوف (استخدم /api/upload-pdf بدلاً منه)

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
// ========== رفع PDF ==========
app.post('/api/upload-pdf', upload.fields([
    { name: 'pdf', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
]), (req, res) => {
    try {
        console.log('\n========== 📤 رفع PDF جديد ==========');
        console.log('📁 الملفات:', req.files);
        console.log('📝 البيانات:', req.body);
        console.log('🔍 sectionId المستلم:', req.body.sectionId, '(Type:', typeof req.body.sectionId + ')');

        if (!req.files || !req.files.pdf) {
            console.log('❌ خطأ: لم يتم رفع ملف PDF');
            return res.status(400).json({ success: false, error: 'لم يتم رفع ملف PDF' });
        }

        if (!req.body.sectionId) {
            console.log('❌ خطأ: sectionId مفقود!');
            return res.status(400).json({ success: false, error: 'sectionId is required' });
        }

        const pdfFile = req.files.pdf[0];
        const coverImageFile = req.files.coverImage ? req.files.coverImage[0] : null;

        // توليد ID فريد (timestamp + random)
        const uniqueId = Date.now() + Math.floor(Math.random() * 1000);

        const parsedSectionId = parseInt(req.body.sectionId);
        console.log('🔢 sectionId بعد التحويل:', parsedSectionId);

        const pdfData = {
            id: uniqueId,
            filename: pdfFile.filename,
            originalName: pdfFile.originalname,
            path: `/uploads/${pdfFile.filename}`,
            size: pdfFile.size,
            sectionId: parsedSectionId,
            title: req.body.title || pdfFile.originalname,
            description: req.body.description || '',
            coverImage: coverImageFile ? `/uploads/${coverImageFile.filename}` : null,
            uploadedAt: new Date().toISOString(),
            downloads: 0,
            views: 0
        };

        console.log('📄 بيانات PDF المحفوظة:', JSON.stringify(pdfData, null, 2));
        console.log('✅ تأكيد: الملف سيُحفظ في القسم رقم:', pdfData.sectionId);

        // حفظ بيانات PDF - قراءة من الملف مباشرة
        let pdfs = [];
        try {
            pdfs = JSON.parse(fs.readFileSync(PDFS_FILE, 'utf8'));
        } catch (e) {
            console.log('⚠️ ملف PDFs فارغ أو غير موجود، إنشاء جديد');
            pdfs = [];
        }

        console.log('📚 عدد الملفات الحالية:', pdfs.length);
        pdfs.push(pdfData);
        console.log('📚 عدد الملفات بعد الإضافة:', pdfs.length);

        // حفظ مع التأكد من اكتمال الكتابة
        fs.writeFileSync(PDFS_FILE, JSON.stringify(pdfs, null, 2));

        // تحديث cache فوراً
        pdfsCache = pdfs;
        cacheTimestamp.pdfs = Date.now();

        console.log('💾 تم حفظ الملف في pdfs.json');
        console.log('✅ تم رفع PDF بنجاح');

        res.json({ success: true, data: pdfData, message: 'تم رفع الملف بنجاح' });
    } catch (error) {
        console.error('❌ خطأ:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// حذف ملف PDF
app.delete('/api/pdfs/:id', (req, res) => {
    try {
        const pdfId = parseInt(req.params.id);
        console.log('🗑️ حذف PDF:', pdfId);

        // قراءة ملفات PDF
        let pdfs = JSON.parse(fs.readFileSync(PDFS_FILE, 'utf8'));
        const pdfIndex = pdfs.findIndex(p => p.id === pdfId);

        if (pdfIndex === -1) {
            return res.status(404).json({ success: false, error: 'الملف غير موجود' });
        }

        const pdf = pdfs[pdfIndex];

        // حذف الملف من المجلد
        const filePath = path.join(__dirname, 'uploads', pdf.filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('✅ تم حذف الملف من المجلد');
        }

        // حذف صورة الغلاف إذا كانت موجودة
        if (pdf.coverImage) {
            const coverPath = path.join(__dirname, pdf.coverImage.replace('/uploads/', 'uploads/'));
            if (fs.existsSync(coverPath)) {
                fs.unlinkSync(coverPath);
                console.log('✅ تم حذف صورة الغلاف');
            }
        }

        // حذف من قائمة PDFs
        pdfs.splice(pdfIndex, 1);
        fs.writeFileSync(PDFS_FILE, JSON.stringify(pdfs, null, 2));

        console.log('✅ تم حذف PDF بنجاح');
        res.json({ success: true, message: 'تم حذف الملف بنجاح' });
    } catch (error) {
        console.error('❌ خطأ:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========== نظام الرسائل والدعم ==========

// الحصول على جميع الرسائل (للأدمن)
app.get('/api/messages', (req, res) => {
    try {
        const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
        res.json({ success: true, data: messages });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// إرسال رسالة جديدة
app.post('/api/messages', (req, res) => {
    try {
        // Validation
        if (!req.body.message || req.body.message.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'الرسالة فارغة' });
        }

        if (!req.body.userName || !req.body.userEmail) {
            return res.status(400).json({ success: false, error: 'بيانات المستخدم ناقصة' });
        }

        const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));

        const newMessage = {
            id: Date.now(),
            userId: req.body.userId || 'guest',
            userName: req.body.userName.trim(),
            userEmail: req.body.userEmail.trim(),
            message: req.body.message.trim(),
            timestamp: new Date().toISOString(),
            status: 'unread',
            adminReply: null,
            adminReplyTime: null
        };

        messages.push(newMessage);
        fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));

        log('✅ رسالة جديدة من:', newMessage.userName);
        res.json({ success: true, data: newMessage });
    } catch (error) {
        console.error('❌ خطأ في إرسال الرسالة:', error);
        res.status(500).json({ success: false, error: 'حدث خطأ في حفظ الرسالة' });
    }
});

// الرد على رسالة
app.post('/api/messages/:id/reply', (req, res) => {
    try {
        const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
        const index = messages.findIndex(m => m.id == req.params.id);

        if (index !== -1) {
            messages[index].adminReply = req.body.reply;
            messages[index].adminReplyTime = new Date().toISOString();
            messages[index].status = 'replied';
            messages[index].readByUser = false; // المستخدم لم يقرأ الرد بعد

            fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
            log('✅ تم الرد على رسالة من:', messages[index].userName);
            res.json({ success: true, data: messages[index] });
        } else {
            res.status(404).json({ success: false, error: 'الرسالة غير موجودة' });
        }
    } catch (error) {
        console.error('❌ خطأ في الرد:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// تعليم رسالة كمقروءة
app.put('/api/messages/:id/read', (req, res) => {
    try {
        const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
        const index = messages.findIndex(m => m.id == req.params.id);

        if (index !== -1) {
            messages[index].status = 'read';
            fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
            res.json({ success: true, data: messages[index] });
        } else {
            res.status(404).json({ success: false, error: 'الرسالة غير موجودة' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// حذف رسالة
app.delete('/api/messages/:id', (req, res) => {
    try {
        let messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
        messages = messages.filter(m => m.id != req.params.id);
        fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// عدد الرسائل غير المقروءة
app.get('/api/messages/unread/count', (req, res) => {
    try {
        const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
        const unreadCount = messages.filter(m => m.status === 'unread').length;
        res.json({ success: true, count: unreadCount });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========== Device Ban API ==========

// جلب قائمة الأجهزة المحظورة
app.get('/api/banned-devices', (req, res) => {
    try {
        let bannedDevices = [];
        if (fs.existsSync(BANNED_DEVICES_FILE)) {
            bannedDevices = JSON.parse(fs.readFileSync(BANNED_DEVICES_FILE, 'utf8'));
        }
        res.json({ success: true, data: bannedDevices });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// حظر جهاز المستخدم
app.post('/api/ban-device', (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, error: 'البريد الإلكتروني مطلوب' });
        }

        // البحث عن المستخدم
        const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        const user = users.find(u => u.email === email);

        if (!user) {
            return res.status(404).json({ success: false, error: 'المستخدم غير موجود' });
        }

        const deviceId = user.deviceId || user.deviceFingerprint;
        if (!deviceId) {
            return res.status(404).json({ success: false, error: 'لا يوجد معرف جهاز لهذا المستخدم' });
        }

        // إضافة الجهاز للقائمة المحظورة
        let bannedDevices = [];
        if (fs.existsSync(BANNED_DEVICES_FILE)) {
            bannedDevices = JSON.parse(fs.readFileSync(BANNED_DEVICES_FILE, 'utf8'));
        }

        // التحقق من عدم وجود الجهاز مسبقاً
        if (!bannedDevices.includes(deviceId)) {
            bannedDevices.push(deviceId);
            fs.writeFileSync(BANNED_DEVICES_FILE, JSON.stringify(bannedDevices, null, 2));
            log(`🚫 تم حظر جهاز المستخدم: ${email} - Device: ${deviceId}`);
        }

        res.json({
            success: true,
            message: 'تم حظر الجهاز بنجاح',
            deviceId: deviceId
        });
    } catch (error) {
        console.error('❌ خطأ في حظر الجهاز:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// فك حظر جهاز
app.post('/api/unban-device', (req, res) => {
    try {
        const deviceId = req.body.deviceId || req.body.deviceFingerprint;

        if (!deviceId) {
            return res.status(400).json({ success: false, error: 'معرف الجهاز مطلوب' });
        }

        // قراءة قائمة الأجهزة المحظورة
        let bannedDevices = [];
        if (fs.existsSync(BANNED_DEVICES_FILE)) {
            bannedDevices = JSON.parse(fs.readFileSync(BANNED_DEVICES_FILE, 'utf8'));
        }

        // إزالة الجهاز من القائمة
        const index = bannedDevices.indexOf(deviceId);
        if (index > -1) {
            bannedDevices.splice(index, 1);
            fs.writeFileSync(BANNED_DEVICES_FILE, JSON.stringify(bannedDevices, null, 2));
            log(`✅ تم فك حظر الجهاز: ${deviceId}`);
        }

        res.json({
            success: true,
            message: 'تم فك الحظر بنجاح'
        });
    } catch (error) {
        console.error('❌ خطأ في فك الحظر:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========== Messenger API Endpoints ==========

// إرسال رسالة من الأدمن (رسالة جديدة)
app.post('/api/messages/admin-send', (req, res) => {
    try {
        if (!req.body.message || req.body.message.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'الرسالة فارغة' });
        }

        const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));

        const newMessage = {
            id: Date.now(),
            userId: 'admin',
            userName: 'الدعم الفني',
            userEmail: req.body.userEmail,
            message: req.body.message.trim(),
            timestamp: new Date().toISOString(),
            status: 'read',
            adminReply: null,
            adminReplyTime: null,
            readByUser: false,
            isAdminMessage: true
        };

        messages.push(newMessage);
        fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));

        log('✅ رسالة من الأدمن إلى:', req.body.userEmail);
        res.json({ success: true, data: newMessage, message: 'تم إرسال الرسالة بنجاح' });
    } catch (error) {
        console.error('❌ خطأ في إرسال الرسالة:', error);
        res.status(500).json({ success: false, error: 'حدث خطأ في حفظ الرسالة' });
    }
});

// إرسال رسالة (Messenger)
app.post('/api/messages/send', (req, res) => {
    try {
        if (!req.body.message || req.body.message.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'الرسالة فارغة' });
        }

        if (!req.body.userName || !req.body.userEmail) {
            return res.status(400).json({ success: false, error: 'بيانات المستخدم ناقصة' });
        }

        const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));

        // التحقق إذا كانت هذه أول رسالة من المستخدم
        const isFirstMessage = !messages.some(m => m.userEmail === req.body.userEmail.trim());

        const newMessage = {
            id: Date.now(),
            userId: req.body.userId || 'guest',
            userName: req.body.userName.trim(),
            userEmail: req.body.userEmail.trim(),
            message: req.body.message.trim(),
            timestamp: new Date().toISOString(),
            status: 'unread',
            adminReply: null,
            adminReplyTime: null,
            readByUser: false
        };

        messages.push(newMessage);

        // إضافة رسالة ترحيبية تلقائية لأول رسالة
        if (isFirstMessage) {
            const welcomeMessage = {
                id: Date.now() + 1,
                userId: 'admin',
                userName: 'أحمد محرم 👋',
                userEmail: req.body.userEmail.trim(),
                message: '🌟 أهلاً بك! شكراً لتواصلك معنا\n\n✨ تم استلام رسالتك بنجاح\n⏰ سأرد عليك خلال دقائق قليلة\n\n💙 أحمد محرم - الدعم الفني',
                timestamp: new Date(Date.now() + 100).toISOString(),
                status: 'read',
                adminReply: null,
                adminReplyTime: null,
                readByUser: false,
                isAdminMessage: true
            };
            messages.push(welcomeMessage);
        }

        fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));

        log('✅ رسالة جديدة من:', newMessage.userName, isFirstMessage ? '(أول رسالة - تم إرسال الترحيب)' : '');
        res.json({ success: true, data: newMessage, message: 'تم إرسال الرسالة بنجاح' });
    } catch (error) {
        console.error('❌ خطأ في إرسال الرسالة:', error);
        res.status(500).json({ success: false, error: 'حدث خطأ في حفظ الرسالة' });
    }
});

// جلب محادثة مستخدم معين
app.get('/api/messages/conversation/:email', (req, res) => {
    try {
        const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
        const userMessages = messages
            .filter(m => m.userEmail === req.params.email)
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        res.json({ success: true, data: userMessages });
    } catch (error) {
        console.error('❌ خطأ في جلب المحادثة:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// عدد الرسائل غير المقروءة لمستخدم معين
app.get('/api/messages/unread/:email', (req, res) => {
    try {
        const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
        const unreadCount = messages.filter(m =>
            m.userEmail === req.params.email &&
            m.adminReply &&
            !m.readByUser
        ).length;

        res.json({ success: true, count: unreadCount });
    } catch (error) {
        console.error('❌ خطأ:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// تعليم رسائل المستخدم كمقروءة
app.put('/api/messages/read/:email', (req, res) => {
    try {
        const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
        let updated = false;

        messages.forEach(m => {
            if (m.userEmail === req.params.email && m.adminReply && !m.readByUser) {
                m.readByUser = true;
                updated = true;
            }
        });

        if (updated) {
            fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
        }

        res.json({ success: true, message: 'تم التعليم كمقروءة' });
    } catch (error) {
        console.error('❌ خطأ:', error);
        res.status(500).json({ success: false, error: error.message });
    }
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