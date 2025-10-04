# ✅ **قائمة التحقق قبل الرفع**
## **Pre-Deployment Checklist**

---

## **📦 التحضير**

### **1. الملفات المطلوبة:**
```bash
✅ server.js
✅ package.json
✅ package-lock.json
✅ chat-widget.js
✅ data/ (المجلد)
✅ uploads/ (المجلد فارغ)
✅ *.html (كل الصفحات)
✅ style.css
✅ .env.example
✅ .gitignore
```

### **2. حذف الملفات غير الضرورية:**
```bash
❌ node_modules/
❌ .git/ (اختياري)
❌ .env
```

---

## **⚙️ الإعدادات**

### **على السيرفر - إنشاء .env:**
```bash
# نسخ من .env.example
cp .env.example .env

# تعديل
NODE_ENV=production
PORT=3000
```

### **تثبيت المكتبات:**
```bash
npm install --production
```

---

## **🚀 التشغيل**

### **Development:**
```bash
npm run dev
```

### **Production:**
```bash
# Option 1: Direct
npm start

# Option 2: PM2 (موصى به)
pm2 start server.js --name nursing
pm2 save
pm2 startup
```

---

## **✅ الاختبار النهائي**

```bash
□ السيرفر يبدأ بدون أخطاء
□ الصفحة الرئيسية تفتح
□ تسجيل الدخول يعمل
□ Dashboard يفتح
□ أيقونة الشات تظهر 💬
□ رفع الملفات يعمل
□ نظام الرسائل يعمل
□ Admin panel يعمل
□ لا توجد console errors
```

---

## **🔒 الأمان**

```bash
□ تغيير كلمات مرور Admin
□ HTTPS enabled (للإنتاج)
□ Firewall configured
□ Backups automated
```

---

## **🎯 الخطوات السريعة**

```bash
# 1. Upload files
scp -r * user@server:/path/to/app

# 2. SSH to server
ssh user@server

# 3. Install & Start
cd /path/to/app
npm install --production
pm2 start server.js

# 4. Test
curl http://localhost:3000

# 5. Done! ✅
```

---

**✅ جاهز للرفع!**
