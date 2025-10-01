// ========================================
// 🚀 ملف التحسينات المتقدمة للموقع
// ========================================

// ==================== نظام التقييمات ====================
class RatingSystem {
    constructor() {
        this.ratings = JSON.parse(localStorage.getItem('pdfRatings') || '{}');
    }

    // تقييم ملف PDF
    ratePDF(pdfId, rating, userId) {
        if (!this.ratings[pdfId]) {
            this.ratings[pdfId] = {
                total: 0,
                count: 0,
                users: {}
            };
        }

        // حفظ تقييم المستخدم
        const oldRating = this.ratings[pdfId].users[userId] || 0;
        this.ratings[pdfId].users[userId] = rating;

        // تحديث المتوسط
        if (oldRating === 0) {
            this.ratings[pdfId].count++;
            this.ratings[pdfId].total += rating;
        } else {
            this.ratings[pdfId].total = this.ratings[pdfId].total - oldRating + rating;
        }

        this.save();
        return this.getAverageRating(pdfId);
    }

    // الحصول على متوسط التقييم
    getAverageRating(pdfId) {
        if (!this.ratings[pdfId] || this.ratings[pdfId].count === 0) {
            return 0;
        }
        return (this.ratings[pdfId].total / this.ratings[pdfId].count).toFixed(1);
    }

    // الحصول على تقييم المستخدم
    getUserRating(pdfId, userId) {
        return this.ratings[pdfId]?.users[userId] || 0;
    }

    // عدد التقييمات
    getRatingCount(pdfId) {
        return this.ratings[pdfId]?.count || 0;
    }

    save() {
        localStorage.setItem('pdfRatings', JSON.stringify(this.ratings));
    }
}

// ==================== نظام المفضلة ====================
class FavoritesSystem {
    constructor() {
        this.favorites = JSON.parse(localStorage.getItem('userFavorites') || '{}');
    }

    // إضافة/إزالة من المفضلة
    toggleFavorite(userId, pdfId) {
        if (!this.favorites[userId]) {
            this.favorites[userId] = [];
        }

        const index = this.favorites[userId].indexOf(pdfId);
        if (index > -1) {
            this.favorites[userId].splice(index, 1);
            this.save();
            return false; // تم الإزالة
        } else {
            this.favorites[userId].push(pdfId);
            this.save();
            return true; // تم الإضافة
        }
    }

    // فحص إذا كان في المفضلة
    isFavorite(userId, pdfId) {
        return this.favorites[userId]?.includes(pdfId) || false;
    }

    // الحصول على المفضلة
    getFavorites(userId) {
        return this.favorites[userId] || [];
    }

    // عدد المفضلة
    getFavoritesCount(userId) {
        return this.favorites[userId]?.length || 0;
    }

    save() {
        localStorage.setItem('userFavorites', JSON.stringify(this.favorites));
    }
}

// ==================== نظام الوضع الليلي ====================
class DarkModeSystem {
    constructor() {
        this.isDark = localStorage.getItem('darkMode') === 'true';
        this.init();
    }

    init() {
        if (this.isDark) {
            this.enable();
        }
    }

    toggle() {
        this.isDark = !this.isDark;
        if (this.isDark) {
            this.enable();
        } else {
            this.disable();
        }
        localStorage.setItem('darkMode', this.isDark);
        return this.isDark;
    }

    enable() {
        document.body.classList.add('dark-mode');
        this.updateColors();
    }

    disable() {
        document.body.classList.remove('dark-mode');
    }

    updateColors() {
        // سيتم تطبيق الألوان عبر CSS
    }
}

// ==================== نظام الإنجازات ====================
class AchievementsSystem {
    constructor() {
        this.achievements = JSON.parse(localStorage.getItem('userAchievements') || '{}');
        this.badges = {
            'first-upload': {
                title: '🎉 أول رفع',
                description: 'رفع أول ملف PDF',
                icon: '📤'
            },
            'explorer': {
                title: '🔍 مستكشف',
                description: 'مشاهدة 10 ملفات',
                icon: '🔎'
            },
            'collector': {
                title: '⭐ جامع',
                description: 'إضافة 5 ملفات للمفضلة',
                icon: '📚'
            },
            'contributor': {
                title: '🌟 مساهم نشط',
                description: 'رفع 5 ملفات',
                icon: '💎'
            },
            'master': {
                title: '👑 خبير',
                description: 'رفع 20 ملف',
                icon: '🏆'
            },
            'reviewer': {
                title: '⭐ مقيّم',
                description: 'تقييم 10 ملفات',
                icon: '🌟'
            }
        };
    }

    // فحص وإضافة إنجاز
    checkAndAward(userId, achievementType, value = 1) {
        if (!this.achievements[userId]) {
            this.achievements[userId] = {
                uploads: 0,
                views: 0,
                favorites: 0,
                ratings: 0,
                badges: []
            };
        }

        const userAchievements = this.achievements[userId];
        const newBadges = [];

        // تحديث الإحصائيات
        switch (achievementType) {
            case 'upload':
                userAchievements.uploads += value;
                if (userAchievements.uploads === 1 && !userAchievements.badges.includes('first-upload')) {
                    userAchievements.badges.push('first-upload');
                    newBadges.push(this.badges['first-upload']);
                }
                if (userAchievements.uploads === 5 && !userAchievements.badges.includes('contributor')) {
                    userAchievements.badges.push('contributor');
                    newBadges.push(this.badges['contributor']);
                }
                if (userAchievements.uploads === 20 && !userAchievements.badges.includes('master')) {
                    userAchievements.badges.push('master');
                    newBadges.push(this.badges['master']);
                }
                break;

            case 'view':
                userAchievements.views += value;
                if (userAchievements.views === 10 && !userAchievements.badges.includes('explorer')) {
                    userAchievements.badges.push('explorer');
                    newBadges.push(this.badges['explorer']);
                }
                break;

            case 'favorite':
                userAchievements.favorites += value;
                if (userAchievements.favorites === 5 && !userAchievements.badges.includes('collector')) {
                    userAchievements.badges.push('collector');
                    newBadges.push(this.badges['collector']);
                }
                break;

            case 'rating':
                userAchievements.ratings += value;
                if (userAchievements.ratings === 10 && !userAchievements.badges.includes('reviewer')) {
                    userAchievements.badges.push('reviewer');
                    newBadges.push(this.badges['reviewer']);
                }
                break;
        }

        this.save();
        return newBadges;
    }

    // الحصول على إنجازات المستخدم
    getUserAchievements(userId) {
        return this.achievements[userId] || null;
    }

    // الحصول على شارات المستخدم
    getUserBadges(userId) {
        const userAchievements = this.achievements[userId];
        if (!userAchievements) return [];
        
        return userAchievements.badges.map(badgeId => this.badges[badgeId]);
    }

    save() {
        localStorage.setItem('userAchievements', JSON.stringify(this.achievements));
    }
}

// ==================== نظام سجل النشاطات ====================
class ActivityLogSystem {
    constructor() {
        this.activities = JSON.parse(localStorage.getItem('activityLog') || '[]');
        this.maxActivities = 100; // الحد الأقصى للنشاطات المحفوظة
    }

    // إضافة نشاط
    addActivity(userId, type, details) {
        const activity = {
            id: Date.now(),
            userId: userId,
            type: type, // upload, view, download, rate, favorite
            details: details,
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString('ar-SA'),
            time: new Date().toLocaleTimeString('ar-SA')
        };

        this.activities.unshift(activity);

        // حذف النشاطات القديمة إذا تجاوزت الحد
        if (this.activities.length > this.maxActivities) {
            this.activities = this.activities.slice(0, this.maxActivities);
        }

        this.save();
    }

    // الحصول على نشاطات المستخدم
    getUserActivities(userId, limit = 20) {
        return this.activities
            .filter(a => a.userId === userId)
            .slice(0, limit);
    }

    // الحصول على جميع النشاطات الأخيرة
    getRecentActivities(limit = 20) {
        return this.activities.slice(0, limit);
    }

    // الحصول على إحصائيات النشاطات
    getActivityStats(userId) {
        const userActivities = this.activities.filter(a => a.userId === userId);
        
        return {
            total: userActivities.length,
            uploads: userActivities.filter(a => a.type === 'upload').length,
            views: userActivities.filter(a => a.type === 'view').length,
            downloads: userActivities.filter(a => a.type === 'download').length,
            ratings: userActivities.filter(a => a.type === 'rate').length,
            favorites: userActivities.filter(a => a.type === 'favorite').length
        };
    }

    save() {
        localStorage.setItem('activityLog', JSON.stringify(this.activities));
    }
}

// ==================== نظام الإشعارات الداخلية ====================
class NotificationSystem {
    constructor() {
        this.notifications = JSON.parse(localStorage.getItem('userNotifications') || '{}');
    }

    // إضافة إشعار
    addNotification(userId, title, message, type = 'info') {
        if (!this.notifications[userId]) {
            this.notifications[userId] = [];
        }

        const notification = {
            id: Date.now(),
            title: title,
            message: message,
            type: type, // info, success, warning, achievement
            read: false,
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString('ar-SA'),
            time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
        };

        this.notifications[userId].unshift(notification);

        // الحد الأقصى 50 إشعار
        if (this.notifications[userId].length > 50) {
            this.notifications[userId] = this.notifications[userId].slice(0, 50);
        }

        this.save();
        return notification;
    }

    // وضع علامة مقروء
    markAsRead(userId, notificationId) {
        const userNotifications = this.notifications[userId];
        if (userNotifications) {
            const notification = userNotifications.find(n => n.id === notificationId);
            if (notification) {
                notification.read = true;
                this.save();
            }
        }
    }

    // وضع علامة مقروء للكل
    markAllAsRead(userId) {
        const userNotifications = this.notifications[userId];
        if (userNotifications) {
            userNotifications.forEach(n => n.read = true);
            this.save();
        }
    }

    // الحصول على الإشعارات
    getNotifications(userId, unreadOnly = false) {
        const userNotifications = this.notifications[userId] || [];
        if (unreadOnly) {
            return userNotifications.filter(n => !n.read);
        }
        return userNotifications;
    }

    // عدد الإشعارات غير المقروءة
    getUnreadCount(userId) {
        const userNotifications = this.notifications[userId] || [];
        return userNotifications.filter(n => !n.read).length;
    }

    save() {
        localStorage.setItem('userNotifications', JSON.stringify(this.notifications));
    }
}

// ==================== إنشاء instances عامة ====================
const ratingSystem = new RatingSystem();
const favoritesSystem = new FavoritesSystem();
const darkModeSystem = new DarkModeSystem();
const achievementsSystem = new AchievementsSystem();
const activityLogSystem = new ActivityLogSystem();
const notificationSystem = new NotificationSystem();

// تصدير للاستخدام العام
if (typeof window !== 'undefined') {
    window.ratingSystem = ratingSystem;
    window.favoritesSystem = favoritesSystem;
    window.darkModeSystem = darkModeSystem;
    window.achievementsSystem = achievementsSystem;
    window.activityLogSystem = activityLogSystem;
    window.notificationSystem = notificationSystem;
}
