// ========== نظام شات Messenger متكامل ==========

(function() {
    'use strict';
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser) return;
    
    let conversation = [];
    let unreadCount = 0;
    let isLoading = false;
    
    const chatHTML = `
        <div id="messengerWidget" style="position: fixed; bottom: 20px; right: 20px; z-index: 9999;">
            <!-- أيقونة الشات -->
            <div id="messengerButton" style="
                width: 60px; height: 60px;
                background: linear-gradient(135deg, #0084ff 0%, #00c6ff 100%);
                border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                cursor: pointer;
                box-shadow: 0 8px 25px rgba(0, 132, 255, 0.4);
                transition: all 0.3s ease;
                position: relative;
            ">
                <i class="fas fa-comments" style="color: white; font-size: 26px;"></i>
                <div id="unreadBadge" style="
                    position: absolute; top: -5px; right: -5px;
                    background: #ff4757; color: white;
                    border-radius: 50%; min-width: 24px; height: 24px;
                    font-size: 12px; font-weight: bold;
                    display: none; align-items: center; justify-content: center;
                    padding: 0 6px; border: 2px solid white;
                "></div>
            </div>
            
            <!-- نافذة الشات -->
            <div id="messengerBox" style="
                display: none; position: absolute;
                bottom: 80px; right: 0;
                width: 380px; max-width: calc(100vw - 40px);
                height: 550px; background: white;
                border-radius: 20px;
                box-shadow: 0 15px 60px rgba(0, 0, 0, 0.3);
                overflow: hidden;
            ">
                <!-- Header -->
                <div style="
                    background: linear-gradient(135deg, #0084ff 0%, #00c6ff 100%);
                    padding: 20px; color: white;
                    display: flex; justify-content: space-between; align-items: center;
                ">
                    <div>
                        <h3 style="margin: 0; font-size: 1.2em; font-weight: 600;">💬 الدعم الفني</h3>
                        <p style="margin: 5px 0 0 0; font-size: 0.85em; opacity: 0.9;">
                            <span style="display: inline-block; width: 8px; height: 8px; background: #4ade80; 
                                border-radius: 50%; margin-left: 5px;"></span>
                            متصل الآن
                        </p>
                    </div>
                    <button id="closeMessenger" style="
                        background: rgba(255, 255, 255, 0.2);
                        border: none; color: white;
                        width: 35px; height: 35px; border-radius: 50%;
                        cursor: pointer; font-size: 20px;
                        display: flex; align-items: center; justify-content: center;
                    ">×</button>
                </div>
                
                <!-- Messages Area -->
                <div id="messagesContainer" style="
                    height: 400px; overflow-y: auto;
                    padding: 20px; background: #f8f9fa;
                ">
                    <div id="welcomeMessage" style="text-align: center; color: #999; padding: 40px 20px;">
                        <div style="
                            width: 80px; height: 80px; margin: 0 auto 20px;
                            background: linear-gradient(135deg, #0084ff 0%, #00c6ff 100%);
                            border-radius: 50%; display: flex; align-items: center; justify-content: center;
                        ">
                            <i class="fas fa-headset" style="font-size: 40px; color: white;"></i>
                        </div>
                        <h4 style="margin: 0 0 10px 0; color: #333;">مرحباً ${currentUser.name}! 👋</h4>
                        <p style="font-size: 0.9em; margin: 0;">كيف يمكننا مساعدتك اليوم؟</p>
                    </div>
                    <div id="messagesList"></div>
                    <div id="typingIndicator" style="display: none; margin: 10px 0;">
                        <div style="
                            display: inline-block; padding: 12px 16px;
                            background: #e9ecef; border-radius: 18px;
                        ">
                            <span style="display: inline-block; width: 8px; height: 8px; 
                                background: #999; border-radius: 50%; margin: 0 2px; animation: typing 1.4s infinite;"></span>
                            <span style="display: inline-block; width: 8px; height: 8px; 
                                background: #999; border-radius: 50%; margin: 0 2px; animation: typing 1.4s infinite 0.2s;"></span>
                            <span style="display: inline-block; width: 8px; height: 8px; 
                                background: #999; border-radius: 50%; margin: 0 2px; animation: typing 1.4s infinite 0.4s;"></span>
                        </div>
                    </div>
                </div>
                
                <!-- Input Area -->
                <div style="
                    padding: 15px; background: white;
                    border-top: 1px solid #e0e0e0;
                    display: flex; gap: 10px; align-items: center;
                ">
                    <input 
                        type="text" 
                        id="messageInput" 
                        placeholder="اكتب رسالة..."
                        style="
                            flex: 1; padding: 12px 16px;
                            border: 2px solid #e0e0e0;
                            border-radius: 25px; font-size: 14px;
                            outline: none;
                        "
                    >
                    <button id="sendButton" style="
                        background: linear-gradient(135deg, #0084ff 0%, #00c6ff 100%);
                        color: white; border: none;
                        width: 45px; height: 45px;
                        border-radius: 50%; cursor: pointer;
                        font-size: 18px;
                        display: flex; align-items: center; justify-content: center;
                    ">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        </div>
        
        <style>
            @keyframes slideUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes typing {
                0%, 60%, 100% { transform: translateY(0); }
                30% { transform: translateY(-10px); }
            }
            #messengerButton:hover {
                transform: scale(1.1);
                box-shadow: 0 12px 35px rgba(0, 132, 255, 0.5);
            }
            #sendButton:hover {
                transform: scale(1.05);
            }
            #messageInput:focus {
                border-color: #0084ff;
            }
            #messagesContainer::-webkit-scrollbar {
                width: 6px;
            }
            #messagesContainer::-webkit-scrollbar-thumb {
                background: #0084ff;
                border-radius: 3px;
            }
            .message-bubble {
                animation: slideUp 0.3s ease;
                margin-bottom: 15px;
            }
        </style>
    `;
    
    document.addEventListener('DOMContentLoaded', function() {
        document.body.insertAdjacentHTML('beforeend', chatHTML);
        
        const messengerButton = document.getElementById('messengerButton');
        const messengerBox = document.getElementById('messengerBox');
        const closeMessenger = document.getElementById('closeMessenger');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        const messagesContainer = document.getElementById('messagesContainer');
        const messagesList = document.getElementById('messagesList');
        const unreadBadge = document.getElementById('unreadBadge');
        const typingIndicator = document.getElementById('typingIndicator');
        const welcomeMessage = document.getElementById('welcomeMessage');
        
        // فتح/إغلاق
        messengerButton.addEventListener('click', () => {
            const isOpen = messengerBox.style.display === 'block';
            messengerBox.style.display = isOpen ? 'none' : 'block';
            if (!isOpen) {
                messageInput.focus();
                loadConversation();
                markAsRead();
            }
        });
        
        closeMessenger.addEventListener('click', () => {
            messengerBox.style.display = 'none';
        });
        
        // إرسال رسالة
        async function sendMessage() {
            const message = messageInput.value.trim();
            if (!message || isLoading) return;
            
            isLoading = true;
            sendButton.disabled = true;
            
            // إضافة الرسالة للواجهة فوراً
            addMessageToUI(message, 'user', Date.now());
            messageInput.value = '';
            
            try {
                const response = await fetch('/api/messages/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: currentUser.id,
                        userName: currentUser.name,
                        userEmail: currentUser.email,
                        message: message
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // إظهار typing indicator
                    typingIndicator.style.display = 'block';
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    
                    // محاكاة وقت الكتابة
                    setTimeout(() => {
                        typingIndicator.style.display = 'none';
                        addMessageToUI('تم استلام رسالتك! سنرد عليك في أقرب وقت ممكن. 🙏', 'admin', Date.now());
                    }, 1500);
                }
            } catch (error) {
                console.error('خطأ:', error);
                addMessageToUI('⚠️ حدث خطأ في الإرسال. تحقق من اتصال السيرفر.', 'admin', Date.now());
            } finally {
                isLoading = false;
                sendButton.disabled = false;
            }
        }
        
        // إضافة رسالة للواجهة
        function addMessageToUI(text, sender, timestamp) {
            if (welcomeMessage && welcomeMessage.parentNode) {
                welcomeMessage.style.display = 'none';
            }
            
            const isUser = sender === 'user';
            const time = new Date(timestamp).toLocaleTimeString('ar-EG', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message-bubble';
            messageDiv.style.cssText = `
                display: flex;
                justify-content: ${isUser ? 'flex-end' : 'flex-start'};
            `;
            
            const safeText = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            
            messageDiv.innerHTML = `
                <div style="
                    max-width: 75%;
                    padding: 12px 16px;
                    border-radius: ${isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px'};
                    background: ${isUser ? 'linear-gradient(135deg, #0084ff 0%, #00c6ff 100%)' : '#e9ecef'};
                    color: ${isUser ? 'white' : '#333'};
                    font-size: 14px;
                    line-height: 1.5;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    word-wrap: break-word;
                ">
                    <div>${safeText}</div>
                    <div style="
                        font-size: 11px;
                        margin-top: 5px;
                        opacity: ${isUser ? '0.8' : '0.6'};
                        text-align: left;
                    ">${time}</div>
                </div>
            `;
            
            messagesList.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        // تحميل المحادثة
        async function loadConversation() {
            try {
                const response = await fetch(`/api/messages/conversation/${currentUser.email}`);
                const data = await response.json();
                
                if (data.success && data.data.length > 0) {
                    messagesList.innerHTML = '';
                    welcomeMessage.style.display = 'none';
                    
                    data.data.forEach(msg => {
                        // رسالة المستخدم
                        addMessageToUI(msg.message, 'user', msg.timestamp);
                        
                        // رد الأدمن إذا وجد
                        if (msg.adminReply) {
                            addMessageToUI(msg.adminReply, 'admin', msg.adminReplyTime);
                        }
                    });
                }
            } catch (error) {
                console.error('خطأ في تحميل المحادثة:', error);
            }
        }
        
        // تحديث عدد غير المقروءة
        async function updateUnreadCount() {
            try {
                const response = await fetch(`/api/messages/unread/${currentUser.email}`);
                const data = await response.json();
                
                if (data.success) {
                    unreadCount = data.count;
                    if (unreadCount > 0) {
                        unreadBadge.textContent = unreadCount;
                        unreadBadge.style.display = 'flex';
                    } else {
                        unreadBadge.style.display = 'none';
                    }
                }
            } catch (error) {
                console.error('خطأ في تحديث العدد:', error);
            }
        }
        
        // تعليم كمقروءة
        async function markAsRead() {
            try {
                await fetch(`/api/messages/read/${currentUser.email}`, {
                    method: 'PUT'
                });
                unreadCount = 0;
                unreadBadge.style.display = 'none';
            } catch (error) {
                console.error('خطأ:', error);
            }
        }
        
        // الأحداث
        sendButton.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        // التحديث التلقائي كل 3 ثواني (سريع)
        setInterval(() => {
            if (messengerBox.style.display === 'block') {
                loadConversation();
            }
            updateUnreadCount();
        }, 3000);
        
        // تحميل أولي
        updateUnreadCount();
    });
})();
