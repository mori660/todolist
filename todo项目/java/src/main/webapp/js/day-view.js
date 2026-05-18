// 日列表视图 - 分四个时间段（深夜/早上/下午/晚上）

var dayViewInstance = null;

class DayView {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.selectedDate = new Date();
        this.todos = [];
        this.onTodoClick = null;
        dayViewInstance = this;
    }

    updateTodos(todos) {
        this.todos = todos || [];
        this.render();
    }

    setDate(dateStr) {
        var parts = dateStr.split('-');
        this.selectedDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        this.render();
    }

    getDateStr() {
        return formatDateStr(this.selectedDate);
    }

    // 用startTime获取某天的任务
    getTodosForDate(dateStr) {
        return this.todos.filter(function(todo) {
            var timeField = todo.startTime || todo.dueDate;
            if (!timeField) return false;
            return timeField.substring(0, 10) === dateStr;
        });
    }

    // 用startTime的小时来分类时间段
    getTodosForPeriod(todos, period) {
        return todos.filter(function(todo) {
            var timeField = todo.startTime || todo.dueDate;
            if (!timeField) return false;
            var hour = new Date(timeField).getHours();
            if (period === 'latenight') return hour >= 0 && hour < 6;
            if (period === 'morning') return hour >= 6 && hour < 12;
            if (period === 'afternoon') return hour >= 12 && hour < 18;
            if (period === 'evening') return hour >= 18 && hour < 24;
            return false;
        });
    }

    render() {
        var dateStr = formatDateStr(this.selectedDate);
        var dayTodos = this.getTodosForDate(dateStr);

        var year = this.selectedDate.getFullYear();
        var month = this.selectedDate.getMonth() + 1;
        var day = this.selectedDate.getDate();
        var weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        var weekDay = weekDays[this.selectedDate.getDay()];

        var today = new Date();
        today.setHours(0, 0, 0, 0);
        var selectedDay = new Date(this.selectedDate);
        selectedDay.setHours(0, 0, 0, 0);
        var isToday = selectedDay.getTime() === today.getTime();

        var html = '';

        // 头部
        html += '<div class="mb-5">';
        html += '  <div class="flex items-center justify-between">';
        html += '    <div class="flex items-center space-x-4">';
        html += '      <button onclick="dayViewInstance.prevDay()" class="w-9 h-9 flex items-center justify-center rounded-xl glass-card hover:bg-white/20 transition-colors cursor-pointer">';
        html += '        <i class="ri-arrow-left-s-line text-white text-lg"></i>';
        html += '      </button>';
        html += '      <div>';
        html += '        <h2 class="text-2xl font-bold text-white">' + year + '年' + month + '月' + day + '日</h2>';
        html += '        <p class="text-blue-200 text-sm mt-0.5">' + weekDay + (isToday ? ' · 今天' : '') + ' · 共 ' + dayTodos.length + ' 个任务</p>';
        html += '      </div>';
        html += '      <button onclick="dayViewInstance.nextDay()" class="w-9 h-9 flex items-center justify-center rounded-xl glass-card hover:bg-white/20 transition-colors cursor-pointer">';
        html += '        <i class="ri-arrow-right-s-line text-white text-lg"></i>';
        html += '      </button>';
        html += '    </div>';
        html += '    <div class="flex items-center space-x-2">';
        html += '      <button onclick="showMonthView()" class="px-3 py-2 text-sm font-medium text-blue-200 bg-blue-500/20 rounded-xl hover:bg-blue-500/30 transition-colors cursor-pointer">';
        html += '        <i class="ri-calendar-line mr-1"></i>月视图';
        html += '      </button>';
        html += '      <button onclick="dayViewInstance.goToday()" class="px-4 py-2 text-sm font-medium text-blue-200 bg-blue-500/20 rounded-xl hover:bg-blue-500/30 transition-colors cursor-pointer">';
        html += '        今天';
        html += '      </button>';
        html += '      <button onclick="showAddModal(\'' + dateStr + 'T09:00\')" class="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors cursor-pointer">';
        html += '        <i class="ri-add-line"></i>';
        html += '      </button>';
        html += '    </div>';
        html += '  </div>';
        html += '</div>';

        if (dayTodos.length === 0) {
            html += '<div class="glass-card rounded-2xl p-12 text-center">';
            html += '  <i class="ri-calendar-check-line text-5xl text-white/50"></i>';
            html += '  <p class="text-white/80 mt-4 text-lg">这一天暂无任务</p>';
            html += '  <p class="text-white/80 text-sm mt-2">点击右上角 + 按钮创建新任务</p>';
            html += '</div>';
            this.container.innerHTML = html;
            return;
        }

        // 四个时间段
        var periods = [
            { key: 'latenight', name: '深夜', time: '00:00 - 06:00', icon: 'ri-moon-clear-line', class: 'time-latenight' },
            { key: 'morning', name: '早上', time: '06:00 - 12:00', icon: 'ri-sun-line', class: 'time-morning' },
            { key: 'afternoon', name: '下午', time: '12:00 - 18:00', icon: 'ri-sun-foggy-line', class: 'time-afternoon' },
            { key: 'evening', name: '晚上', time: '18:00 - 24:00', icon: 'ri-moon-line', class: 'time-evening' }
        ];

        var self = this;

        periods.forEach(function(period, pIndex) {
            var periodTodos = self.getTodosForPeriod(dayTodos, period.key);

            html += '<div class="mb-5 anim-up" style="animation-delay: ' + (pIndex * 0.1) + 's">';
            html += '  <div class="flex items-center space-x-3 mb-3">';
            html += '    <div class="time-period-header ' + period.class + ' flex items-center space-x-2">';
            html += '      <i class="' + period.icon + ' text-base text-white/80"></i>';
            html += '      <span class="text-sm font-semibold text-white">' + period.name + '</span>';
            html += '      <span class="text-xs text-white/70">' + period.time + '</span>';
            html += '      <span class="text-xs text-white/60 ml-1">(' + periodTodos.length + ')</span>';
            html += '    </div>';
            html += '  </div>';

            if (periodTodos.length === 0) {
                html += '<div class="glass-card rounded-xl p-3 text-center">';
                html += '  <span class="text-white/50 text-xs">暂无任务</span>';
                html += '</div>';
            } else {
                html += '<div class="space-y-1.5">';
                periodTodos.forEach(function(todo) {
                    var statusColor = getStatusColor(todo.status);
                    var isCompleted = todo.status === 'COMPLETED';
                    var isIncomplete = todo.status === 'INCOMPLETE';
                    var startTime = formatTime(todo.startTime);
                    var endTime = formatTime(todo.dueDate);
                    var statusIcon = isCompleted ? 'ri-checkbox-circle-fill' : isIncomplete ? 'ri-close-circle-fill' : 'ri-checkbox-blank-circle-line';
                    var iconColor = isCompleted ? 'text-emerald-400' : isIncomplete ? 'text-red-400' : 'text-white/60';

                    html += '<div class="task-card glass-card rounded-xl p-3 ' + statusColor.border + ' border-l-2" onclick="editTodo(' + todo.id + ')">';
                    html += '  <div class="flex items-center space-x-3">';
                    html += '    <i class="' + statusIcon + ' ' + iconColor + ' text-lg cursor-pointer" onclick="event.stopPropagation(); toggleTodoStatus(' + todo.id + ', \'' + todo.status + '\')"></i>';
                    html += '    <div class="flex-1 min-w-0">';
                    html += '      <div class="flex items-center justify-between">';
                    html += '        <div class="flex items-center min-w-0">';
                    html += '          <h4 class="text-sm font-medium ' + (isCompleted ? 'line-through text-white/50' : isIncomplete ? 'text-red-200' : 'text-white') + ' truncate">' + escapeHtml(todo.title) + '</h4>';
                    html += '        </div>';
                    html += '        <div class="flex items-center space-x-2 ml-3">';
                    html += '          <span class="text-xs text-white/70">' + startTime + ' - ' + endTime + '</span>';
                    html += '        </div>';
                    html += '      </div>';
                    html += '      <div class="flex items-center justify-between mt-0.5">';
                    if (todo.content) {
                        html += '      <p class="text-xs text-white/60 truncate">' + escapeHtml(todo.content) + '</p>';
                    } else {
                        html += '      <span></span>';
                    }
                    html += '        <button onclick="event.stopPropagation(); deleteTodo(' + todo.id + ')" class="px-2 py-1 text-xs text-white/70 glass-card rounded-lg hover:text-red-300 hover:bg-red-500/20 transition-all ml-2">';
                    html += '          <i class="ri-delete-bin-line"></i>';
                    html += '        </button>';
                    html += '      </div>';
                    html += '    </div>';
                    html += '  </div>';
                    html += '</div>';
                });
                html += '</div>';
            }

            html += '</div>';
        });

        this.container.innerHTML = html;
    }

    prevDay() {
        this.selectedDate.setDate(this.selectedDate.getDate() - 1);
        var dateStr = formatDateStr(this.selectedDate);
        document.getElementById('filterDate').value = dateStr;
        selectedDateForSidebar = dateStr;
        this.render();
        updateSelectedDateTasks(dateStr);
    }

    nextDay() {
        this.selectedDate.setDate(this.selectedDate.getDate() + 1);
        var dateStr = formatDateStr(this.selectedDate);
        document.getElementById('filterDate').value = dateStr;
        selectedDateForSidebar = dateStr;
        this.render();
        updateSelectedDateTasks(dateStr);
    }

    goToday() {
        this.selectedDate = new Date();
        var dateStr = formatDateStr(this.selectedDate);
        document.getElementById('filterDate').value = dateStr;
        selectedDateForSidebar = dateStr;
        this.render();
        updateSelectedDateTasks(dateStr);
    }
}

// 切换任务状态 - 先获取完整数据再更新
function toggleTodoStatus(todoId, currentStatus) {
    var newStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';

    // 先获取完整的todo数据
    fetch('/api/todo/get/' + todoId)
        .then(function(response) { return response.json(); })
        .then(function(data) {
            if (data.success) {
                var todo = data.data;
                // 用完整数据更新状态
                return fetch('/api/todo/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: todo.id,
                        title: todo.title,
                        content: todo.content,
                        status: newStatus,
                        startTime: todo.startTime ? todo.startTime.replace('T', ' ').substring(0, 16) : '',
                        dueDate: todo.dueDate ? todo.dueDate.replace('T', ' ').substring(0, 16) : ''
                    })
                });
            }
        })
        .then(function(response) { return response ? response.json() : null; })
        .then(function(data) {
            if (data && data.success) {
                loadTodos();
            }
        })
        .catch(function(error) {
        });
}
