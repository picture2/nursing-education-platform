@echo off
echo ========================================
echo    رفع المشروع على GitHub
echo ========================================
echo.

echo [1/4] تهيئة Git...
git init
echo ✅ تم!
echo.

echo [2/4] إضافة الملفات...
git add .
echo ✅ تم!
echo.

echo [3/4] Commit...
git commit -m "Nursing Education Platform - Ready for deployment"
echo ✅ تم!
echo.

echo ========================================
echo الآن:
echo 1. افتح GitHub.com
echo 2. اعمل New Repository
echo 3. اسم المشروع: nursing-platform
echo 4. اضغط Create
echo 5. انسخ الأمر اللي هيظهر (git remote add...)
echo 6. الصقه هنا واضغط Enter
echo ========================================
echo.

set /p remote="الصق الأمر هنا: "
%remote%

echo.
echo [4/4] رفع الملفات...
git push -u origin main

echo.
echo ========================================
echo ✅ تم رفع المشروع على GitHub!
echo ========================================
pause
