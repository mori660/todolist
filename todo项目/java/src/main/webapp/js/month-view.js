// 月视图组件 - 毛玻璃风格

class MonthView {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.todos = [];
        this.onDateSelect = null;
        this.onTodoClick = null;
        this.render();
    }

    updateTodos(todos) {
        this.todos = todos || [];
        this.render();
    }

    // 用startTime获取某天的任务
    getTodosForDate(dateStr) {
        return this.todos.filter(function(todo) {
            var timeField = todo.startTime || todo.dueDate;
            if (!timeField) return false;
            return timeField.substring(0, 10) === dateStr;
        });
    }

    render() {
        var year = this.currentDate.getFullYear();
        var month = this.currentDate.getMonth();
        var monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
        var title = year + '年 ' + monthNames[month];

        var firstDay = new Date(year, month, 1);
        var lastDay = new Date(year, month + 1, 0);
        var startDay = firstDay.getDay();
        startDay = startDay === 0 ? 6 : startDay - 1;
        var daysInMonth = lastDay.getDate();
        var prevMonthLastDay = new Date(year, month, 0).getDate();

        var today = new Date();
        today.setHours(0, 0, 0, 0);
        var todayStr = this.formatDate(today);
        var selectedStr = this.formatDate(this.selectedDate);

        var html = '';

        // 月份导航
        html += '<div class="flex items-center justify-between mb-5">';
        html += '  <div class="flex items-center space-x-3">';
        html += '    <button onclick="monthView.prevMonth()" class="w-9 h-9 flex items-center justify-center rounded-xl glass-card hover:bg-white/20 transition-colors cursor-pointer">';
        html += '      <i class="ri-arrow-left-s-line text-white text-lg"></i>';
        html += '    </button>';
        html += '    <h2 class="text-xl font-bold text-white">' + title + '</h2>';
        html += '    <button onclick="monthView.nextMonth()" class="w-9 h-9 flex items-center justify-center rounded-xl glass-card hover:bg-white/20 transition-colors cursor-pointer">';
        html += '      <i class="ri-arrow-right-s-line text-white text-lg"></i>';
        html += '    </button>';
        html += '  </div>';
        html += '  <div class="flex items-center space-x-2">';
        html += '    <button onclick="showMonthView()" class="px-3 py-2 text-sm font-medium text-blue-200 bg-blue-500/20 rounded-xl hover:bg-blue-500/30 transition-colors cursor-pointer">';
        html += '      <i class="ri-calendar-line mr-1"></i>月视图';
        html += '    </button>';
        html += '    <button onclick="monthView.goToday()" class="px-4 py-2 text-sm font-medium text-blue-200 bg-blue-500/20 rounded-xl hover:bg-blue-500/30 transition-colors cursor-pointer">';
        html += '      今天';
        html += '    </button>';
        html += '  </div>';
        html += '</div>';

        // 星期标题
        html += '<div class="grid grid-cols-7 mb-2">';
        var dayLabels = ['一', '二', '三', '四', '五', '六', '日'];
        for (var i = 0; i < 7; i++) {
            var isWeekend = i >= 5;
            html += '<div class="text-center text-sm font-bold ' + (isWeekend ? 'text-red-300' : 'text-white/90') + ' py-2">' + dayLabels[i] + '</div>';
        }
        html += '</div>';

        // 日期网格
        html += '<div class="grid grid-cols-7 gap-1">';

        // 上个月
        for (var i = startDay - 1; i >= 0; i--) {
            var day = prevMonthLastDay - i;
            var date = new Date(year, month - 1, day);
            var dateStr = this.formatDate(date);
            var dayTodos = this.getTodosForDate(dateStr);

            html += '<div class="month-cell glass-card cursor-pointer hover:bg-white/15 transition-colors" onclick="monthView.selectDate(\'' + dateStr + '\')">';
            html += '  <div class="text-sm text-white/60 mb-1">' + day + '</div>';
            html += this.renderTaskDots(dayTodos, 3);
            html += '</div>';
        }

        // 本月
        for (var day = 1; day <= daysInMonth; day++) {
            var date = new Date(year, month, day);
            var dateStr = this.formatDate(date);
            var isToday = dateStr === todayStr;
            var isSelected = dateStr === selectedStr;
            var dayTodos = this.getTodosForDate(dateStr);

            var cellClass = 'month-cell glass-card cursor-pointer hover:bg-white/15 transition-colors';
            if (isSelected) {
                cellClass = 'month-cell glass-card cursor-pointer bg-blue-500/25 ring-2 ring-blue-400/60 hover:bg-blue-500/30 transition-colors';
            }

            html += '<div class="' + cellClass + '" onclick="monthView.selectDate(\'' + dateStr + '\')">';
            html += '  <div class="flex items-center justify-between mb-1">';
            if (isToday) {
                html += '    <span class="w-7 h-7 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">' + day + '</span>';
            } else {
                html += '    <span class="text-sm font-semibold text-white">' + day + '</span>';
            }
            if (dayTodos.length > 0) {
                html += '    <span class="text-xs text-white/70">' + dayTodos.length + '</span>';
            }
            html += '  </div>';
            html += this.renderTaskCards(dayTodos, 2);
            html += '</div>';
        }

        // 下个月
        var remainingDays = 42 - (startDay + daysInMonth);
        for (var day = 1; day <= remainingDays; day++) {
            var date = new Date(year, month + 1, day);
            var dateStr = this.formatDate(date);
            var dayTodos = this.getTodosForDate(dateStr);

            html += '<div class="month-cell glass-card cursor-pointer hover:bg-white/15 transition-colors" onclick="monthView.selectDate(\'' + dateStr + '\')">';
            html += '  <div class="text-sm text-white/60 mb-1">' + day + '</div>';
            html += this.renderTaskDots(dayTodos, 3);
            html += '</div>';
        }

        html += '</div>';

        this.container.innerHTML = html;
    }

    renderTaskCards(todos, maxShow) {
        if (!todos || todos.length === 0) return '';

        var html = '';
        var showCount = Math.min(todos.length, maxShow);

        for (var i = 0; i < showCount; i++) {
            var todo = todos[i];
            var statusClass = 'task-item-pending';
            if (todo.status === 'COMPLETED') statusClass = 'task-item-completed';
            if (todo.status === 'INCOMPLETE') statusClass = 'task-item-incomplete';

            html += '<div class="task-item ' + statusClass + '" onclick="event.stopPropagation(); monthView.handleTodoClick(' + todo.id + ')">';
            html += escapeHtml(todo.title);
            html += '</div>';
        }

        if (todos.length > maxShow) {
            html += '<div class="text-xs text-white/60 text-center mt-1">+' + (todos.length - maxShow) + '</div>';
        }

        return html;
    }

    renderTaskDots(todos, maxShow) {
        if (!todos || todos.length === 0) return '';

        var html = '<div class="flex flex-wrap gap-1 mt-1">';
        var showCount = Math.min(todos.length, maxShow);

        for (var i = 0; i < showCount; i++) {
            var statusColor = getStatusColor(todos[i].status);
            html += '<span class="w-2 h-2 rounded-full ' + statusColor.dot + '"></span>';
        }

        if (todos.length > maxShow) {
            html += '<span class="text-xs text-white/60">+' + (todos.length - maxShow) + '</span>';
        }

        html += '</div>';
        return html;
    }

    handleTodoClick(todoId) {
        if (this.onTodoClick) {
            this.onTodoClick(todoId);
        }
    }

    selectDate(dateStr) {
        this.selectedDate = new Date(dateStr);
        this.render();

        if (this.onDateSelect) {
            this.onDateSelect(dateStr);
        }
    }

    prevMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.render();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.render();
    }

    goToday() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.render();

        if (this.onDateSelect) {
            this.onDateSelect(this.formatDate(new Date()));
        }
    }

    formatDate(date) {
        var year = date.getFullYear();
        var month = String(date.getMonth() + 1).padStart(2, '0');
        var day = String(date.getDate()).padStart(2, '0');
        return year + '-' + month + '-' + day;
    }
}
