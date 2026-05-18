<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>注册 - TODO管理系统</title>
    <!-- 原生CSS -->
    <link rel="stylesheet" href="css/tailwind-converted.css">
    <!-- Remix Icon (本地) -->
    <link href="lib/remixicon/remixicon.css" rel="stylesheet">
</head>
<body class="min-h-screen auth-bg flex items-center justify-center p-4">
    <!-- 背景遮罩 -->
    <div class="fixed inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/30 to-pink-900/20"></div>

    <!-- 注册卡片 -->
    <div class="relative z-10 w-full max-w-md animate-fade-in-up">
        <div class="glass-card rounded-2xl shadow-2xl p-8">
            <!-- 标题 -->
            <div class="text-center mb-8">
                <h1 class="font-display text-3xl text-gray-900 mb-2">用户注册</h1>
                <p class="text-gray-500 font-body">创建您的账号</p>
            </div>

            <!-- 注册表单 -->
            <form onsubmit="register(event)" class="space-y-5">
                <!-- 用户名 -->
                <div class="form-group">
                    <label for="username" class="block text-sm font-medium text-gray-700 mb-2">
                        <i class="ri-user-line mr-1"></i>用户名
                    </label>
                    <input type="text" id="username" name="username"
                        class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-200 outline-none"
                        placeholder="请输入用户名" required>
                    <div class="field-error" id="usernameError"></div>
                </div>

                <!-- 密码 -->
                <div class="form-group">
                    <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
                        <i class="ri-lock-line mr-1"></i>密码
                    </label>
                    <div class="relative">
                        <input type="password" id="password" name="password"
                            class="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-200 outline-none"
                            placeholder="请输入密码（至少6位）" required minlength="6">
                        <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            onclick="togglePassword('password')">
                            <i class="ri-eye-line text-xl" id="eyeIcon1"></i>
                        </button>
                    </div>
                    <div class="field-error" id="passwordError"></div>
                </div>

                <!-- 确认密码 -->
                <div class="form-group">
                    <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
                        <i class="ri-lock-line mr-1"></i>确认密码
                    </label>
                    <div class="relative">
                        <input type="password" id="confirmPassword" name="confirmPassword"
                            class="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-200 outline-none"
                            placeholder="请再次输入密码" required>
                        <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            onclick="togglePassword('confirmPassword')">
                            <i class="ri-eye-line text-xl" id="eyeIcon2"></i>
                        </button>
                    </div>
                    <div class="field-error" id="confirmPasswordError"></div>
                </div>

                <!-- 注册按钮 -->
                <button type="submit" class="btn-primary w-full py-3 px-4 text-base">
                    <i class="ri-user-add-line mr-2"></i>注册
                </button>
            </form>

            <!-- 登录链接 -->
            <div class="mt-6 text-center">
                <p class="text-gray-500">
                    已有账号？
                    <a href="login.jsp" class="text-primary-600 hover:text-primary-700 font-medium transition-colors">
                        立即登录
                    </a>
                </p>
            </div>
        </div>
    </div>

    <script src="js/app.js"></script>
    <script>
        // 页面加载时检查URL参数
        document.addEventListener('DOMContentLoaded', function() {
            const urlParams = new URLSearchParams(window.location.search);
            const username = urlParams.get('username');
            if (username) {
                document.getElementById('username').value = decodeURIComponent(username);
            }
        });

        // 切换密码可见性
        function togglePassword(inputId) {
            const input = document.getElementById(inputId);
            const eyeIcon = document.getElementById(inputId === 'password' ? 'eyeIcon1' : 'eyeIcon2');

            if (input.type === 'password') {
                input.type = 'text';
                eyeIcon.className = 'ri-eye-off-line text-xl';
            } else {
                input.type = 'password';
                eyeIcon.className = 'ri-eye-line text-xl';
            }
        }

        // 清除错误提示
        function clearErrors() {
            document.querySelectorAll('.form-group').forEach(group => {
                group.classList.remove('error');
            });
            document.querySelectorAll('.field-error').forEach(error => {
                error.textContent = '';
                error.style.display = 'none';
            });
        }

        // 显示字段错误
        function showFieldError(fieldId, message) {
            const field = document.getElementById(fieldId);
            const errorDiv = document.getElementById(fieldId + 'Error');
            const formGroup = field.closest('.form-group');

            formGroup.classList.add('error');
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }

        // 修改注册函数
        function register(event) {
            event.preventDefault();
            clearErrors();

            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            const confirmPassword = document.getElementById('confirmPassword').value.trim();

            if (!username || !password) {
                if (!username) showFieldError('username', '用户名不能为空');
                if (!password) showFieldError('password', '密码不能为空');
                return;
            }

            if (password !== confirmPassword) {
                showFieldError('confirmPassword', '两次输入的密码不一致');
                return;
            }

            if (password.length < 6) {
                showFieldError('password', '密码长度不能少于6位');
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
                    // 用户已存在时在用户名下方提示
                    if (data.message && data.message.includes('用户名已存在')) {
                        showFieldError('username', '用户名已存在');
                    } else {
                        showAlert('danger', data.message);
                    }
                }
            })
            .catch(error => {
                showAlert('danger', '注册失败，请稍后重试');
                console.error('注册错误:', error);
            });
        }
    </script>
</body>
</html>
