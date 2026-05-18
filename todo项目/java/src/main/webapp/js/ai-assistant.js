// AI助手组件（预留接口）

class AIAssistant {
    constructor() {
        this.isOpen = false;
        this.messages = [];
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
            <div id="aiChatWindow" class="hidden" style="position:fixed; bottom:96px; right:24px; width:320px; z-index:10000; background:#fff; border-radius:16px; box-shadow:0 20px 60px rgba(0,0,0,0.3); border:1px solid #e5e7eb; overflow:hidden;">
                <!-- 头部 -->
                <div style="position:relative; display:flex; align-items:center; justify-content:space-between; padding:16px; background:#f9fafb; border-bottom:1px solid #e5e7eb;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div style="width:32px; height:32px; background:linear-gradient(135deg,#60a5fa,#2563eb); border-radius:50%; display:flex; align-items:center; justify-content:center;">
                            <i class="ri-robot-line" style="color:#fff; font-size:16px;"></i>
                        </div>
                        <div>
                            <div style="font-size:14px; font-weight:600; color:#333;">AI 助手</div>
                            <div style="font-size:11px; color:#999;">随时为您服务</div>
                        </div>
                    </div>
                    <button onclick="aiAssistant.toggle()" class="modal-close-btn" title="关闭" style="position:absolute; top:12px; right:12px;">
                        <i class="ri-close-line"></i>
                    </button>
                </div>

                <!-- 消息列表 -->
                <div id="aiMessages" style="height:256px; overflow-y:auto; padding:16px; background:#f9fafb;">
                </div>

                <!-- 快捷按钮 -->
                <div style="padding:8px 16px; background:#fff; border-top:1px solid #f3f4f6;">
                    <div style="display:flex; flex-wrap:wrap; gap:8px;">
                        <button onclick="aiAssistant.processCommand('查看今日任务')" class="ai-quick-btn">今日任务</button>
                        <button onclick="aiAssistant.processCommand('查看本周任务')" class="ai-quick-btn">本周任务</button>
                        <button onclick="aiAssistant.processCommand('添加任务')" class="ai-quick-btn ai-quick-btn-primary">添加任务</button>
                    </div>
                </div>

                <!-- 输入框 -->
                <div style="padding:12px 16px; background:#fff; border-top:1px solid #e5e7eb;">
                    <div style="display:flex; gap:8px;">
                        <input type="text" id="aiInput"
                            style="flex:1; padding:8px 14px; font-size:13px; border:1px solid #e5e7eb; border-radius:12px; outline:none; color:#333; background:#fff; transition:border-color 0.2s;"
                            placeholder="输入消息..."
                            onfocus="this.style.borderColor='#3B82F6'"
                            onblur="this.style.borderColor='#e5e7eb'"
                            onkeypress="if(event.key==='Enter') aiAssistant.sendMessage()">
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
        this.addMessage('assistant', '你好！我是您的AI助手。我可以帮您：\n• 查看今日/本周任务\n• 快速添加任务\n• 查询任务统计\n\n有什么可以帮您的吗？');
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

    // 发送消息
    sendMessage() {
        const input = document.getElementById('aiInput');
        const text = input.value.trim();

        if (!text) return;

        // 添加用户消息
        this.addMessage('user', text);
        input.value = '';

        // 处理命令
        this.processCommand(text);
    }

    // 处理命令
    processCommand(text) {
        // 简单命令处理（预留接口）
        setTimeout(() => {
            if (text.includes('今日') || text.includes('今天')) {
                this.showTodayTasks();
            } else if (text.includes('本周')) {
                this.showWeekTasks();
            } else if (text.includes('添加') || text.includes('新建') || text.includes('创建')) {
                this.addNewTask(text);
            } else if (text.includes('统计') || text.includes('数量')) {
                this.showStats();
            } else if (text.includes('帮助') || text.includes('help')) {
                this.showHelp();
            } else {
                this.addMessage('assistant', '抱歉，我暂时无法理解您的请求。您可以尝试：\n• "查看今日任务"\n• "查看本周任务"\n• "添加任务 XXX"\n• "查看统计"');
            }
        }, 500);
    }

    // 显示今日任务
    showTodayTasks() {
        if (!window._allTodos) {
            this.addMessage('assistant', '正在加载任务数据...');
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = this.formatDate(today);

        const todayTodos = window._allTodos.filter(todo => {
            if (!todo.dueDate) return false;
            return todo.dueDate.substring(0, 10) === todayStr;
        });

        if (todayTodos.length === 0) {
            this.addMessage('assistant', '今天没有待办任务，您可以享受轻松的一天！');
        } else {
            let msg = `今日共有 ${todayTodos.length} 个任务：\n`;
            todayTodos.forEach((todo, i) => {
                const status = todo.status === 'COMPLETED' ? '✓' : '○';
                msg += `${status} ${todo.title}\n`;
            });
            this.addMessage('assistant', msg);
        }
    }

    // 显示本周任务
    showWeekTasks() {
        if (!window._allTodos) {
            this.addMessage('assistant', '正在加载任务数据...');
            return;
        }

        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const weekTodos = window._allTodos.filter(todo => {
            if (!todo.dueDate) return false;
            const dueDate = new Date(todo.dueDate);
            return dueDate >= weekStart && dueDate <= weekEnd;
        });

        if (weekTodos.length === 0) {
            this.addMessage('assistant', '本周没有待办任务，您可以提前规划一下！');
        } else {
            let msg = `本周共有 ${weekTodos.length} 个任务：\n`;
            weekTodos.forEach(todo => {
                const status = todo.status === 'COMPLETED' ? '✓' : todo.status === 'OVERDUE' ? '!' : '○';
                const date = todo.dueDate ? todo.dueDate.substring(5, 10) : '';
                msg += `${status} [${date}] ${todo.title}\n`;
            });
            this.addMessage('assistant', msg);
        }
    }

    // 添加新任务
    addNewTask(text) {
        // 提取任务标题
        let title = text.replace(/添加|新建|创建|任务/g, '').trim();

        if (title) {
            this.addMessage('assistant', `好的，我来帮您添加任务："${title}"`);
            // 打开新增模态框并预填标题
            setTimeout(() => {
                showAddModal();
                document.getElementById('title').value = title;
            }, 500);
        } else {
            this.addMessage('assistant', '好的，请告诉我任务标题，例如："添加任务 买牛奶"');
            // 打开新增模态框
            setTimeout(() => {
                showAddModal();
            }, 500);
        }
    }

    // 显示统计
    showStats() {
        if (!window._allTodos) {
            this.addMessage('assistant', '正在加载任务数据...');
            return;
        }

        const total = window._allTodos.length;
        const completed = window._allTodos.filter(t => t.status === 'COMPLETED').length;
        const pending = window._allTodos.filter(t => t.status === 'PENDING').length;
        const inProgress = window._allTodos.filter(t => t.status === 'IN_PROGRESS').length;
        const overdue = window._allTodos.filter(t => t.status === 'OVERDUE').length;

        const msg = `任务统计：\n` +
            `总任务：${total}\n` +
            `已完成：${completed}\n` +
            `进行中：${inProgress}\n` +
            `待处理：${pending}\n` +
            `已超时：${overdue}\n` +
            `完成率：${total > 0 ? Math.round(completed / total * 100) : 0}%`;

        this.addMessage('assistant', msg);
    }

    // 显示帮助
    showHelp() {
        this.addMessage('assistant', '我可以帮您完成以下操作：\n\n' +
            '1. 查看任务\n' +
            '   • "查看今日任务" - 显示今天的任务\n' +
            '   • "查看本周任务" - 显示本周的任务\n\n' +
            '2. 添加任务\n' +
            '   • "添加任务 XXX" - 快速添加新任务\n\n' +
            '3. 查看统计\n' +
            '   • "查看统计" - 显示任务完成情况\n\n' +
            '试试看吧！');
    }

    // 添加消息到列表
    addMessage(type, content) {
        this.messages.push({ type, content, time: new Date() });

        const messagesDiv = document.getElementById('aiMessages');
        const isAssistant = type === 'assistant';

        const messageHtml = isAssistant
            ? '<div style="display:flex; justify-content:flex-start; margin-bottom:12px;">'
              + '<div style="display:flex; gap:8px; max-width:80%;">'
              + '<div style="width:24px; height:24px; background:#eff6ff; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0;">'
              + '<i class="ri-robot-line" style="color:#2563eb; font-size:11px;"></i></div>'
              + '<div style="background:#f3f4f6; border-radius:16px 16px 16px 4px; padding:8px 14px;">'
              + '<p style="font-size:13px; color:#333; white-space:pre-line; margin:0;">' + content + '</p>'
              + '</div></div></div>'
            : '<div style="display:flex; justify-content:flex-end; margin-bottom:12px;">'
              + '<div style="max-width:80%;">'
              + '<div style="background:linear-gradient(135deg,#60a5fa,#2563eb); border-radius:16px 16px 4px 16px; padding:8px 14px;">'
              + '<p style="font-size:13px; color:#fff; white-space:pre-line; margin:0;">' + content + '</p>'
              + '</div></div></div>';

        messagesDiv.insertAdjacentHTML('beforeend', messageHtml);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    // 格式化日期
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}
