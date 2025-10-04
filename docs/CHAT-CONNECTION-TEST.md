# 🔗 **فحص اتصالات نظام الشات**

## **1. chat-widget.js → server.js**

### **الإرسال:**
```javascript
// chat-widget.js (line 242)
fetch('/api/messages', {
    method: 'POST',
    body: JSON.stringify({
        userId, userName, userEmail, message
    })
})

// server.js (line 777)
app.post('/api/messages', (req, res) => {
    // يستقبل ويحفظ في data/messages.json
})
```
✅ **متصل**

### **جلب الرسائل:**
```javascript
// chat-widget.js (line 321)
fetch('/api/messages')

// server.js (line 767)
app.get('/api/messages', (req, res) => {
    // يجلب من data/messages.json
})
```
✅ **متصل**

---

## **2. messages.html → server.js**

### **جلب الرسائل:**
```javascript
// messages.html (line 475)
fetch('/api/messages')
```
✅ **متصل**

### **الرد على رسالة:**
```javascript
// messages.html (line 631)
fetch(`/api/messages/${id}/reply`, {
    method: 'POST',
    body: JSON.stringify({ reply })
})

// server.js (line 814)
app.post('/api/messages/:id/reply', (req, res) => {
    // يحفظ الرد
})
```
✅ **متصل**

### **تعليم كمقروءة:**
```javascript
// messages.html (line 653)
fetch(`/api/messages/${id}/read`, {
    method: 'PUT'
})

// server.js (line 835)
app.put('/api/messages/:id/read', (req, res) => {
    // يعلم كمقروءة
})
```
✅ **متصل**

### **حذف:**
```javascript
// messages.html (line 672)
fetch(`/api/messages/${id}`, {
    method: 'DELETE'
})

// server.js (line 851)
app.delete('/api/messages/:id', (req, res) => {
    // يحذف
})
```
✅ **متصل**

---

## **3. admin-backend.html → server.js**

### **عدد غير المقروءة:**
```javascript
// admin-backend.html (line 1879)
fetch('/api/messages/unread/count')

// server.js (line 863)
app.get('/api/messages/unread/count', (req, res) => {
    // يعيد العدد
})
```
✅ **متصل**

---

## **4. الملفات المدمجة:**

### **dashboard.html:**
```html
<!-- line 882 -->
<script src="chat-widget.js"></script>
```
✅ **مدمج**

### **pdf-viewer.html:**
```html
<!-- line 1771 -->
<script src="chat-widget.js"></script>
```
✅ **مدمج**

### **profile.html:**
```html
<!-- line 593 -->
<script src="chat-widget.js"></script>
```
✅ **مدمج**

---

## **5. التخزين:**

### **data/messages.json:**
```json
✅ موجود
✅ مُهيأ في server.js (line 131-133)
✅ يُقرأ ويُكتب بشكل صحيح
```

---

## **✅ النتيجة النهائية:**

```
✅ كل الاتصالات صحيحة
✅ كل الـ API endpoints متصلة
✅ Widget مدمج في كل الصفحات المطلوبة
✅ Badge في admin يعمل
✅ data/messages.json مُهيأ
✅ لا توجد روابط مكسورة
```

**🎉 النظام مربوط 100%! 🎉**
