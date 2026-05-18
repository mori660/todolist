// 全局变量
let currentUser = null;

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
});

// 检查登录状态
function checkLoginStatus() {
    fetch('/api/user/check')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.loggedIn) {
                currentUser = {
                    userId: data.userId,
                    username: data.username
                };
                updateNavbar();
                if (typeof loadTodos === 'function') {
                    loadTodos();
                }
            } else {
                // 如果当前页面不是登录或注册页面，则重定向到登录页面
                const currentPage = window.location.pathname;
                if (!currentPage.includes('login.jsp') && !currentPage.includes('register.jsp')) {
                    window.location.href = '/login.jsp';
                }
            }
        })
        .catch(function(error) {
        });
}

// 更新导航栏
function updateNavbar() {
    const usernameDisplay = document.getElementById('usernameDisplay');
    if (usernameDisplay && currentUser) {
        usernameDisplay.textContent = currentUser.username;
    }
}

// 用户登录
function login(event) {
    event.preventDefault();

    // 清除之前的错误提示
    if (typeof clearErrors === 'function') {
        clearErrors();
    }

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
        if (typeof showFieldError === 'function') {
            if (!username) showFieldError('username', '用户名不能为空');
            if (!password) showFieldError('password', '密码不能为空');
        } else {
            showAlert('danger', '用户名和密码不能为空');
        }
        return;
    }

    fetch('/api/user/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert('success', '登录成功，正在跳转...');
            setTimeout(() => {
                window.location.href = '/index.jsp';
            }, 1000);
        } else {
            // 密码错误时清空密码框
            document.getElementById('password').value = '';

            // 用户不存在时跳转到注册页面
            if (data.message && data.message.includes('用户不存在')) {
                showAlert('warning', '用户不存在，即将跳转到注册页面...');
                setTimeout(() => {
                    window.location.href = '/register.jsp?username=' + encodeURIComponent(username);
                }, 1500);
            } else if (data.message && data.message.includes('密码错误')) {
                // 密码错误在密码框下方提示
                if (typeof showFieldError === 'function') {
                    showFieldError('password', '密码错误');
                } else {
                    showAlert('danger', '密码错误');
                }
            } else {
                showAlert('danger', data.message);
            }
        }
    })
    .catch(function(error) {
        showAlert('danger', '登录失败，请稍后重试');
    });
}

// 用户注册
function register(event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();

    if (!username || !password) {
        showAlert('danger', '用户名和密码不能为空');
        return;
    }

    if (password !== confirmPassword) {
        showAlert('danger', '两次输入的密码不一致');
        return;
    }

    if (password.length < 6) {
        showAlert('danger', '密码长度不能少于6位');
        return;
    }

    fetch('/api/user/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert('success', '注册成功，请登录');
            setTimeout(() => {
                window.location.href = '/login.jsp';
            }, 1500);
        } else {
            showAlert('danger', data.message);
        }
    })
    .catch(function(error) {
        showAlert('danger', '注册失败，请稍后重试');
    });
}

// 用户登出
function logout() {
    fetch('/api/user/logout', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            currentUser = null;
            window.location.href = '/login.jsp';
        }
    })
    .catch(function(error) {
        window.location.href = '/login.jsp';
    });
}

// 显示提示消息 - 居中显示
function showAlert(type, message) {
    // 移除已有的提示
    const existingAlert = document.querySelector('.alert-notification');
    if (existingAlert) {
        existingAlert.remove();
    }

    // 创建新的提示
    const alert = document.createElement('div');
    alert.className = 'alert-notification fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none';

    const iconMap = {
        'success': 'ri-check-line',
        'danger': 'ri-error-warning-line',
        'warning': 'ri-alert-line',
        'info': 'ri-information-line'
    };

    const colorMap = {
        'success': 'bg-emerald-500/40 text-emerald-100 border-emerald-400/50',
        'danger': 'bg-red-500/40 text-red-100 border-red-400/50',
        'warning': 'bg-amber-500/40 text-amber-100 border-amber-400/50',
        'info': 'bg-blue-500/40 text-blue-100 border-blue-400/50'
    };

    const icon = iconMap[type] || 'ri-information-line';
    const colors = colorMap[type] || colorMap['info'];

    alert.innerHTML = `
        <div class="${colors} border rounded-2xl px-6 py-4 shadow-2xl flex items-center space-x-3 animate-fade-in-up backdrop-blur-xl pointer-events-auto">
            <i class="${icon} text-xl"></i>
            <span class="text-sm font-medium">${message}</span>
        </div>
    `;

    document.body.appendChild(alert);

    // 3秒后自动消失
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 3000);
}

// 格式化日期
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
}

// 检查截止日期是否过期
function isOverdue(dateString) {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateString);
    return dueDate < today;
}

// 检查截止日期是否即将到来（3天内）
function isDueSoon(dateString) {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateString);
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    return dueDate >= today && dueDate <= threeDaysLater;
}

// 获取截止日期的CSS类
function getDueDateClass(dateString) {
    if (!dateString) return '';
    if (isOverdue(dateString)) return 'overdue';
    if (isDueSoon(dateString)) return 'soon';
    return '';
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 节流函数
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}
