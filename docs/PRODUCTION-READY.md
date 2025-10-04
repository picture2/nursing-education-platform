# 🚀 **دليل التحضير للإنتاج**
## **Production Deployment Checklist**

---

## **✅ قبل الرفع - Checklist**

### **1. الملفات الضرورية:**
```
✅ server.js
✅ package.json
✅ package-lock.json
✅ .gitignore
✅ .env.example
✅ chat-widget.js
✅ data/ (المجلد فارغ - سيُملأ تلقائياً)
✅ uploads/ (المجلد فارغ)
✅ كل ملفات HTML
✅ style.css
```

### **2. الملفات غير الضرورية (يمكن حذفها):**
```
❌ node_modules/ (يتم تثبيتها على السيرفر)
❌ .git/ (اختياري)
❌ .env (يُنشأ على السيرفر)
❌ ملفات .md الزائدة (اختياري)
```

---

## **🔧 الإعدادات للإنتاج**

### **1. Environment Variables:**

إنشاء ملف `.env` على السيرفر:
```bash
# نسخ من .env.example
cp .env.example .env

# تعديل القيم
NODE_ENV=production
PORT=3000  # أو البورت المخصص
```

### **2. تثبيت المكتبات:**
```bash
# Production only
npm install --production

# Or with devDependencies (للتطوير)
npm install
```

### **3. تشغيل السيرفر:**

#### **Development:**
```bash
npm run dev
```

#### **Production:**
```bash
# مباشرة
npm start

# أو باستخدام PM2 (موصى به)
pm2 start server.js --name nursing-platform
pm2 save
pm2 startup
```

---

## **🔒 الأمان للإنتاج**

### **1. تغيير Passwords:**
```javascript
// في data/users.json
// غيّر كلمات مرور Admin
{
  "email": "admin@nursing.com",
  "password": "كلمة_سر_قوية_جداً"  // ⚠️ غيّرها!
}
```

### **2. CORS Configuration:**
```javascript
// في server.js (اختياري)
const cors = require('cors');
app.use(cors({
    origin: 'https://your-domain.com',  // نطاقك فقط
    credentials: true
}));
```

### **3. Rate Limiting (موصى به):**
```bash
npm install express-rate-limit

# في server.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: 100 // 100 طلب
});

app.use('/api/', limiter);
```

---

## **📂 هيكل المجلدات للإنتاج**

```
nursing-platform/
├── server.js              ✅ السيرفر الرئيسي
├── package.json           ✅ المكتبات
├── .env                   ✅ الإعدادات (إنشاؤه)
├── chat-widget.js         ✅ نظام الشات
├── data/                  ✅ (فارغ - يُملأ تلقائياً)
│   ├── sections.json
│   ├── users.json
│   ├── pdfs.json
│   ├── banned-devices.json
│   └── messages.json
├── uploads/               ✅ (فارغ - للملفات المرفوعة)
├── *.html                 ✅ كل صفحات HTML
└── style.css              ✅ الأنماط
```

---

## **☁️ الرفع على خدمات السحابة**

### **1. Heroku:**
```bash
# Install Heroku CLI
heroku login
heroku create nursing-platform

# Set environment
heroku config:set NODE_ENV=production

# Deploy
git push heroku main

# Open
heroku open
```

### **2. Railway:**
```bash
# Install Railway CLI
npm install -g @railway/cli
railway login
railway init
railway up
```

### **3. Render:**
```
1. Push to GitHub
2. Connect Render to repo
3. Set environment: NODE_ENV=production
4. Deploy
```

### **4. VPS (DigitalOcean, AWS, etc.):**
```bash
# SSH to server
ssh user@your-server-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repo
git clone your-repo
cd nursing-platform

# Install dependencies
npm install --production

# Setup PM2
npm install -g pm2
pm2 start server.js
pm2 startup
pm2 save

# Setup Nginx (reverse proxy)
sudo apt install nginx
# Configure nginx to proxy to localhost:3000
```

---

## **🔍 اختبار ما قبل الإنتاج**

### **Checklist:**
```bash
✅ npm start يعمل بدون أخطاء
✅ كل endpoints تستجيب
✅ رفع الملفات يعمل
✅ نظام الشات يعمل
✅ البيانات تُحفظ بشكل صحيح
✅ لا توجد console errors في المتصفح
✅ الموقع يعمل على mobile
✅ الأمان:
   - كلمات مرور قوية
   - HTTPS enabled
   - CORS configured
   - File size limits
```

---

## **⚡ الأداء**

### **1. Enable Compression (موجود):**
```javascript
✅ app.use(compression());
```

### **2. Cache Headers:**
```javascript
// إضافة في server.js
app.use(express.static(__dirname, {
    maxAge: '1d'  // cache للملفات الثابتة
}));
```

### **3. Database (للمستقبل):**
```
⚠️ حالياً: JSON files
✅ للإنتاج الكبير: MongoDB/PostgreSQL
```

---

## **📊 Monitoring**

### **PM2 Monitoring:**
```bash
pm2 monit                    # live monitoring
pm2 logs                     # view logs
pm2 status                   # status
pm2 restart nursing-platform # restart
```

### **Error Tracking (موصى به):**
```bash
npm install @sentry/node

# في server.js
const Sentry = require('@sentry/node');
Sentry.init({ dsn: 'your-sentry-dsn' });
```

---

## **🔄 التحديثات**

### **Deploy Update:**
```bash
# 1. Pull changes
git pull origin main

# 2. Install new dependencies
npm install

# 3. Restart server
pm2 restart nursing-platform

# 4. Test
curl http://localhost:3000
```

---

## **💾 Backup**

### **Backup Data:**
```bash
# يومياً - backup data folder
tar -czf backup-$(date +%Y%m%d).tar.gz data/

# رفع على S3/Google Cloud
aws s3 cp backup-*.tar.gz s3://your-bucket/
```

### **Restore:**
```bash
tar -xzf backup-YYYYMMDD.tar.gz
```

---

## **🐛 Troubleshooting**

### **المشكلة: PORT already in use**
```bash
# Find process
lsof -i :3000

# Kill process
kill -9 PID
```

### **المشكلة: Module not found**
```bash
npm install
```

### **المشكلة: Permission denied**
```bash
sudo chown -R $USER:$USER .
chmod -R 755 .
```

### **المشكلة: Files not uploading**
```bash
# Check uploads folder permissions
chmod 755 uploads/
```

---

## **✅ Final Checklist**

```
□ NODE_ENV=production في .env
□ كلمات المرور قوية
□ PM2 configured
□ Nginx/reverse proxy setup
□ HTTPS enabled
□ Domain configured
□ Firewall rules set
□ Backups automated
□ Monitoring enabled
□ Error tracking setup
□ Logs configured
□ Test all features
```

---

## **📞 Support**

إذا واجهت مشاكل:
1. تحقق من logs: `pm2 logs`
2. تحقق من console errors
3. تحقق من network tab
4. تحقق من ملفات JSON

---

**🎉 النظام الآن جاهز للإنتاج! 🚀**

**التاريخ:** 2025-10-03  
**الحالة:** ✅ Production Ready
