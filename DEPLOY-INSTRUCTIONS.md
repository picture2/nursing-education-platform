# 🚀 خطوات رفع الموقع على Railway

## الخطوة 1️⃣: رفع على GitHub

### افتح Terminal في مجلد المشروع واكتب:

```bash
# تهيئة Git (إذا لم يكن موجوداً)
git init

# إضافة كل الملفات
git add .

# Commit
git commit -m "Initial commit - Nursing Education Platform"

# ربط مع GitHub (غير username/repo-name باسمك)
git remote add origin https://github.com/username/nursing-platform.git

# رفع الكود
git push -u origin main
```

**ملاحظة:** لازم تعمل Repository جديد على GitHub أولاً!

---

## الخطوة 2️⃣: ربط مع Railway

### 1. اذهب إلى: https://railway.app
### 2. سجل دخول بحساب GitHub
### 3. اضغط "New Project"
### 4. اختر "Deploy from GitHub repo"
### 5. اختر الـ Repository اللي عملته
### 6. Railway هيعمل Deploy تلقائي!

---

## الخطوة 3️⃣: إعدادات Railway

### 1. اضغط على المشروع
### 2. اذهب إلى "Settings"
### 3. اضبط:
   - **Port:** 3000
   - **Start Command:** `npm start`

### 4. في قسم "Variables" أضف:
```
NODE_ENV=production
PORT=3000
```

---

## الخطوة 4️⃣: احصل على الرابط

### Railway هيديك رابط زي:
```
https://your-app.railway.app
```

---

## 🎉 تم! الموقع الآن على الإنترنت!

### اختبر الموقع:
1. افتح الرابط
2. سجل دخول كأدمن:
   - Email: Ahmed@0100
   - Password: Ahmed@01005209667
3. شوف لوحة الإدارة
4. سجل مستخدمين جدد

---

## ⚠️ ملاحظات مهمة:

### 1. البيانات المؤقتة:
- ملف `data/users.json` سيُمسح عند كل deploy جديد
- لحل دائم: استخدم MongoDB Atlas (مجاني)

### 2. الملفات المرفوعة:
- مجلد `uploads/` سيُمسح أيضاً
- الحل: استخدم Cloudinary أو S3

### 3. Domain مخصص (اختياري):
- في Railway Settings → Domains
- أضف domain خاص بك

---

## 📱 البدائل الأخرى:

### Vercel (للـ Frontend فقط):
```bash
npm i -g vercel
vercel
```

### Render (مجاني أيضاً):
https://render.com

### Heroku (مدفوع):
https://heroku.com

---

## 🆘 حل المشاكل:

### إذا فشل الـ Deploy:
1. تأكد من وجود `package.json`
2. تأكد من `"start": "node server.js"` في scripts
3. شوف Logs في Railway Dashboard
4. تأكد أن Port = 3000

### إذا البيانات لا تُحفظ:
- Railway filesystem مؤقت!
- استخدم MongoDB Atlas: https://mongodb.com/cloud/atlas

---

## 💡 نصيحة:

استخدم MongoDB Atlas للبيانات الدائمة:
```bash
npm install mongodb mongoose
```

ثم اربط السيرفر بقاعدة البيانات!
