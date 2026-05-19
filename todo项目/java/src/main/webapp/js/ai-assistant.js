// AI 助手组件 - 集成 MiMo-V2-Omni AI

/**
 * AI 助手类
 */
class AIAssistant {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.isLoading = false;
        this.init();
    }

    init() {
        this.createChatWindow();
        this.addWelcomeMessage();
        // 3秒后自动弹出AI助手
        setTimeout(() => {
            if (!this.isOpen) {
                this.toggle();
            }
        }, 3000);
    }

    // 创建聊天窗口
    createChatWindow() {
        const chatHtml = `
            <div id="aiChatWindow" class="hidden" style="position:fixed; bottom:96px; right:24px; width:400px; z-index:10000; background:#fff; border-radius:16px; box-shadow:0 20px 60px rgba(0,0,0,0.3); border:1px solid #e5e7eb; overflow:hidden;">
                <!-- 头部 -->
                <div style="position:relative; display:flex; align-items:center; justify-content:space-between; padding:16px; background:#f9fafb; border-bottom:1px solid #e5e7eb;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div style="width:32px; height:32px; background:linear-gradient(135deg,#60a5fa,#2563eb); border-radius:50%; display:flex; align-items:center; justify-content:center;">
                            <i class="ri-robot-line" style="color:#fff; font-size:16px;"></i>
                        </div>
                        <div>
                            <div style="font-size:14px; font-weight:600; color:#333;">AI 助手</div>
                            <div id="aiStatus" style="font-size:11px; color:#999;">随时为您服务</div>
                        </div>
                    </div>
                    <button onclick="aiAssistant.toggle()" class="modal-close-btn" title="关闭" style="position:absolute; top:12px; right:12px;">
                        <i class="ri-close-line"></i>
                    </button>
                </div>

                <!-- 消息列表 -->
                <div id="aiMessages" style="height:350px; overflow-y:auto; padding:16px; background:#f9fafb;">
                </div>

                <!-- 快捷按钮 -->
                <div style="padding:8px 16px; background:#fff; border-top:1px solid #f3f4f6;">
                    <div style="display:flex; flex-wrap:wrap; gap:8px;">
                        <button onclick="aiAssistant.sendQuickMessage('帮我看看今天的任务')" class="ai-quick-btn">今日任务</button>
                        <button onclick="aiAssistant.sendQuickMessage('帮我看看本周的任务')" class="ai-quick-btn">本周任务</button>
                        <button onclick="aiAssistant.sendQuickMessage('帮我分析一下任务进度')" class="ai-quick-btn">进度分析</button>
                        <button onclick="aiAssistant.sendQuickMessage('帮我回顾一下最近的任务完成情况')" class="ai-quick-btn">任务回顾</button>
                    </div>
                </div>

                <!-- 输入框 -->
                <div style="padding:12px 16px; background:#fff; border-top:1px solid #e5e7eb;">
                    <div style="display:flex; gap:8px; align-items:center;">
                        <!-- 输入框 -->
                        <input type="text" id="aiInput"
                            style="flex:1; padding:8px 14px; font-size:13px; border:1px solid #e5e7eb; border-radius:12px; outline:none; color:#333; background:#fff; transition:border-color 0.2s;"
                            placeholder="输入消息..."
                            onfocus="this.style.borderColor='#3B82F6'"
                            onblur="this.style.borderColor='#e5e7eb'"
                            onkeypress="if(event.key==='Enter') aiAssistant.sendMessage()">

                        <!-- 发送按钮 -->
                        <button onclick="aiAssistant.sendMessage()"
                            style="width:40px; height:40px; background:linear-gradient(135deg,#60a5fa,#2563eb); color:#fff; border:none; border-radius:12px; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:opacity 0.2s;"
                            onmouseover="this.style.opacity='0.85'"
                            onmouseout="this.style.opacity='1'">
                            <i class="ri-send-plane-line"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        const div = document.createElement('div');
        div.innerHTML = chatHtml;
        document.body.appendChild(div.firstElementChild);
    }

    // 添加欢迎消息
    addWelcomeMessage() {
        this.addMessage('assistant', '你好！我是您的AI助手，由 MiMo-V2-Omni 驱动。\n\n我可以帮您：\n• 查看和管理任务\n• 创建新任务\n• 分析任务进度\n• 制定任务计划\n• 任务回顾总结');
    }

    // 切换聊天窗口显示
    toggle() {
        const window = document.getElementById('aiChatWindow');
        this.isOpen = !this.isOpen;

        if (this.isOpen) {
            window.classList.remove('hidden');
            window.classList.add('animate-fade-in-up');
            document.getElementById('aiInput').focus();
        } else {
            window.classList.add('hidden');
        }
    }

    // 发送快捷消息
    sendQuickMessage(text) {
        const input = document.getElementById('aiInput');
        input.value = text;
        input.focus();
    }

    // 发送文字消息
    async sendMessage() {
        const input = document.getElementById('aiInput');
        const text = input.value.trim();

        if (!text || this.isLoading) return;

        // 添加用户消息
        this.addMessage('user', text);
        input.value = '';

        // 发送到后端
        await this.callAiApi(text);
    }

    // 调用 AI API
    async callAiApi(message) {
        this.isLoading = true;
        this.setStatus('正在思考...');
        const loadingId = this.addLoading();

        try {
            const resp = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message })
            });

            const data = await resp.json();
            this.removeLoading(loadingId);

            if (data.success) {
                // 解析 AI 返回的内容，提取 response 字段
                const displayMessage = this.parseAiResponse(data.message);
                this.addMessage('assistant', displayMessage);

                // 如果执行了任务操作，刷新页面数据
                if (data.actionPerformed && typeof loadTodos === 'function') {
                    loadTodos();
                }
            } else {
                this.addMessage('assistant', '❌ ' + (data.message || '请求失败'));
            }
        } catch (e) {
            console.error('AI 请求失败:', e);
            this.removeLoading(loadingId);
            this.addMessage('assistant', '❌ 网络错误，请稍后重试');
        } finally {
            this.isLoading = false;
            this.setStatus('随时为您服务');
        }
    }

    // 解析 AI 返回的内容，提取 response 字段
    parseAiResponse(message) {
        if (!message) return '操作完成';

        // 尝试解析 JSON 格式
        try {
            // 移除可能的 markdown 代码块标记
            let jsonStr = message.trim();
            if (jsonStr.startsWith('```json')) {
                jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (jsonStr.startsWith('```')) {
                jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }

            const parsed = JSON.parse(jsonStr);
            if (parsed.response) {
                return parsed.response;
            }
            if (parsed.message) {
                return parsed.message;
            }
        } catch (e) {
            // JSON 解析失败，尝试手动提取 response 字段
            const responseMatch = message.match(/"response"\s*:\s*"([^"]*)/);
            if (responseMatch && responseMatch[1]) {
                return responseMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
            }
        }

        return message;
    }

    // 设置状态
    setStatus(text) {
        document.getElementById('aiStatus').textContent = text;
    }

    // 添加加载指示器
    addLoading() {
        const id = 'loading-' + Date.now();
        const messagesDiv = document.getElementById('aiMessages');
        const html = `
            <div id="${id}" style="display:flex; justify-content:flex-start; margin-bottom:12px;">
                <div style="display:flex; gap:8px; max-width:80%;">
                    <div style="width:24px; height:24px; background:#eff6ff; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                        <i class="ri-robot-line" style="color:#2563eb; font-size:11px;"></i>
                    </div>
                    <div style="background:#f3f4f6; border-radius:16px 16px 16px 4px; padding:12px 16px;">
                        <div style="display:flex; gap:4px;">
                            <div class="ai-loading-dot" style="width:8px; height:8px; background:#9ca3af; border-radius:50%; animation:aiPulse 1.4s infinite;"></div>
                            <div class="ai-loading-dot" style="width:8px; height:8px; background:#9ca3af; border-radius:50%; animation:aiPulse 1.4s infinite 0.2s;"></div>
                            <div class="ai-loading-dot" style="width:8px; height:8px; background:#9ca3af; border-radius:50%; animation:aiPulse 1.4s infinite 0.4s;"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        messagesDiv.insertAdjacentHTML('beforeend', html);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        return id;
    }

    // 移除加载指示器
    removeLoading(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    // 添加消息到列表
    addMessage(type, content) {
        this.messages.push({ type, content, time: new Date() });

        const messagesDiv = document.getElementById('aiMessages');
        const isAssistant = type === 'assistant';

        // 简单的换行处理
        const formattedContent = this.escapeHtml(content).replace(/\n/g, '<br>');

        const messageHtml = isAssistant
            ? `<div style="display:flex; justify-content:flex-start; margin-bottom:12px;">
                <div style="display:flex; gap:8px; max-width:85%;">
                    <div style="width:24px; height:24px; background:#eff6ff; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                        <i class="ri-robot-line" style="color:#2563eb; font-size:11px;"></i>
                    </div>
                    <div style="background:#f3f4f6; border-radius:16px 16px 16px 4px; padding:10px 14px;">
                        <p style="font-size:13px; color:#333; margin:0; line-height:1.5;">${formattedContent}</p>
                    </div>
                </div>
            </div>`
            : `<div style="display:flex; justify-content:flex-end; margin-bottom:12px;">
                <div style="max-width:85%;">
                    <div style="background:linear-gradient(135deg,#60a5fa,#2563eb); border-radius:16px 16px 4px 16px; padding:10px 14px;">
                        <p style="font-size:13px; color:#fff; margin:0; line-height:1.5;">${formattedContent}</p>
                    </div>
                </div>
            </div>`;

        messagesDiv.insertAdjacentHTML('beforeend', messageHtml);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    // HTML 转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 添加加载动画样式
if (!document.getElementById('aiAssistantStyles')) {
    const style = document.createElement('style');
    style.id = 'aiAssistantStyles';
    style.textContent = `
        @keyframes aiPulse {
            0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
            40% { opacity: 1; transform: scale(1); }
        }
    `;
    document.head.appendChild(style);
}
