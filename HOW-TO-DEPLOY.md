# 🚀 دليل رفع المشروع

## ✅ الخطوات السريعة

### 1️⃣ رفع على GitHub

```bash
# في Terminal
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/nursing-platform.git
git push -u origin main
```

---

### 2️⃣ رفع على Railway (موصى به ⭐)

1. افتح [Railway.app](https://railway.app)
2. اضغط **"Login with GitHub"**
3. اضغط **"New Project"**
4. اختر **"Deploy from GitHub"**
5. اختر المشروع: `nursing-platform`
6. انتظر 2-3 دقائق حتى يكتمل Deploy
7. اذهب إلى **Settings → Generate Domain**
8. ✅ **انسخ الرابط واستخدمه!**

**مثال:** `https://nursing-platform-production.up.railway.app`

---

### 3️⃣ رفع على Render

1. افتح [Render.com](https://render.com)
2. اضغط **"New +"**
3. اختر **"Web Service"**
4. وصّل حسابك بـ GitHub
5. اختر المشروع
6. **إعدادات:**
   - **Name:** `nursing-platform`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
7. اضغط **"Create Web Service"**
8. انتظر 3-5 دقائق
9. ✅ **خذ الرابط!**

**مثال:** `https://nursing-platform.onrender.com`

---

## 🔒 إعدادات الأمان (اختياري)

### إضافة متغيرات بيئية:

في Railway أو Render، أضف:

```
NODE_ENV=production
PORT=3000
```

---

## ✅ اختبار المشروع بعد الرفع

### 1. افتح الرابط:
```
https://YOUR_PROJECT_URL.railway.app
```

### 2. سجل دخول كأدمن:
```
Email: Ahmed@0100
Password: Ahmed@01005209667
```

### 3. اختبر:
- ✅ تسجيل حساب جديد
- ✅ إضافة قسم
- ✅ حذف قسم
- ✅ رفع PDF

---

## 🐛 حل المشاكل

### المشكلة: الموقع لا يفتح
**الحل:**
- تأكد من أن Deploy انتهى (شوف Logs)
- تأكد من أن Domain تم إنشاؤه

### المشكلة: الملفات لا ترفع
**الحل:**
- Railway و Render يدعمان رفع الملفات مؤقتاً
- للإنتاج استخدم Cloudinary أو AWS S3

### المشكلة: البيانات تُمسح بعد إعادة Deploy
**الحل:**
- استخدم MongoDB Atlas (مجاني)
- أو PostgreSQL من Render

---

## 📊 الأداء

```
✅ Railway: سريع جداً (2-3 ثوانٍ)
✅ Render: متوسط (3-5 ثوانٍ)
✅ Vercel: سريع لكن للـ Frontend فقط
```

---

## 🎉 تم!

الآن مشروعك على الإنترنت! شارك الرابط مع الجميع! 🚀

**مثال:**
```
https://nursing-platform.railway.app
```
