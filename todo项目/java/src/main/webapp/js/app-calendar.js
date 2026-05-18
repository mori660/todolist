// 日历应用主逻辑

var currentView = 'month';
var currentFilter = 'all';
var monthView;
var dayView;
var aiAssistant;
var selectedDateForSidebar = null; // null表示显示全部
var isBatchDeleteMode = false;

document.addEventListener('DOMContentLoaded', function() {
    // 初始化月视图
    monthView = new MonthView('monthView');
    monthView.onDateSelect = function(dateStr) {
        showDayView(dateStr);
    };
    monthView.onTodoClick = function(todoId) {
        editTodo(todoId);
    };
    window.monthView = monthView;

    // 初始化日视图
    dayView = new DayView('dayView');
    window.dayView = dayView;

    // 初始化AI助手
    aiAssistant = new AIAssistant();
    window.aiAssistant = aiAssistant;

    // 检查登录状态并加载数据
    checkLoginStatus();
});

// 切换到日视图
function showDayView(dateStr) {
    currentView = 'day';
    selectedDateForSidebar = dateStr;
    document.getElementById('filterDate').value = dateStr;
    document.getElementById('monthViewContainer').classList.add('hidden');
    document.getElementById('dayViewContainer').classList.remove('hidden');

    dayView.setDate(dateStr);
    dayView.updateTodos(window._allTodos || []);
    updateSelectedDateTasks(dateStr);
}

// 切换回月视图
function showMonthView() {
    currentView = 'month';
    selectedDateForSidebar = null;
    document.getElementById('filterDate').value = '';
    document.getElementById('monthViewContainer').classList.remove('hidden');
    document.getElementById('dayViewContainer').classList.add('hidden');

    if (window._allTodos) {
        monthView.updateTodos(window._allTodos);
    }
    // 左侧显示全部任务
    updateSelectedDateTasks(null);
}

// 更新左侧任务列表
// dateStr为null时显示全部任务，否则显示指定日期的任务
function updateSelectedDateTasks(dateStr) {
    if (!window._allTodos) return;

    var filteredTodos;
    if (dateStr) {
        filteredTodos = window._allTodos.filter(function(todo) {
            var timeField = todo.startTime || todo.dueDate;
            if (!timeField) return false;
            return timeField.substring(0, 10) === dateStr;
        });
    } else {
        filteredTodos = window._allTodos.slice(); // 显示全部
    }

    // 按状态筛选
    if (currentFilter !== 'all') {
        filteredTodos = filteredTodos.filter(function(todo) {
            return todo.status === currentFilter;
        });
    }

    // 按开始时间排序
    filteredTodos.sort(function(a, b) {
        var timeA = a.startTime || a.dueDate || '';
        var timeB = b.startTime || b.dueDate || '';
        return new Date(timeA) - new Date(timeB);
    });

    var container = document.getElementById('selectedDateTasks');
    var dateTitle = document.getElementById('selectedDateTitle');
    var dateCount = document.getElementById('selectedDateCount');

    // 更新标题
    if (dateStr) {
        var date = new Date(dateStr + 'T00:00:00');
        var month = date.getMonth() + 1;
        var day = date.getDate();
        var weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        var weekDay = weekDays[date.getDay()];
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        var isToday = date.getTime() === today.getTime();
        dateTitle.textContent = isToday ? '今日任务' : month + '月' + day + '日 ' + weekDay;
    } else {
        dateTitle.textContent = '全部任务';
    }
    dateCount.textContent = filteredTodos.length + ' 个';

    if (filteredTodos.length === 0) {
        container.innerHTML = '<div class="text-center py-6"><i class="ri-inbox-line text-2xl text-white/30"></i><p class="text-white/60 text-sm mt-1">暂无任务</p></div>';
        return;
    }

    var html = '';
    filteredTodos.forEach(function(todo) {
        var statusColor = getStatusColor(todo.status);
        var isCompleted = todo.status === 'COMPLETED';
        var isIncomplete = todo.status === 'INCOMPLETE';
        var startTime = formatTime(todo.startTime);
        var endTime = formatTime(todo.dueDate);
        var statusIcon = isCompleted ? 'ri-checkbox-circle-fill' : isIncomplete ? 'ri-close-circle-fill' : 'ri-checkbox-blank-circle-line';
        var iconColor = isCompleted ? 'task-status-completed' : isIncomplete ? 'task-status-incomplete' : 'task-status-pending';

        html += '<div class="glass-card rounded-lg p-3 cursor-pointer hover:bg-white/15 transition-all">';
        html += '  <div class="flex items-center space-x-2">';
        // 批量删除模式下显示checkbox
        if (isBatchDeleteMode) {
            html += '    <input type="checkbox" class="todo-checkbox w-4 h-4 rounded accent-blue-500 flex-shrink-0" value="' + todo.id + '" onclick="event.stopPropagation()">';
        }
        html += '    <i class="' + statusIcon + ' ' + iconColor + ' text-base cursor-pointer" onclick="event.stopPropagation(); toggleTodoStatus(' + todo.id + ', \'' + todo.status + '\')"></i>';
        html += '    <div class="flex-1 min-w-0" onclick="editTodo(' + todo.id + ')">';
        html += '      <div class="flex items-center"><span class="text-sm ' + (isCompleted ? 'line-through text-white/70' : isIncomplete ? 'text-red-300' : 'text-white') + ' truncate">' + escapeHtml(todo.title) + '</span></div>';
        html += '    </div>';
        html += '    <div class="flex items-center space-x-1">';
        html += '      <span class="text-xs text-white/70">' + startTime + '</span>';
        html += '    </div>';
        html += '  </div>';
        html += '</div>';
    });

    container.innerHTML = html;
}

// 筛选任务
function filterTasks(filter) {
    currentFilter = filter;

    document.querySelectorAll('.filter-btn').forEach(function(btn) {
        btn.classList.remove('bg-white/20', 'bg-blue-500/30', 'bg-emerald-500/30', 'bg-red-500/30', 'text-white');
        btn.classList.add('bg-white/10', 'text-white/60');
    });
    var activeBtn = document.getElementById('filter-' + filter);
    if (activeBtn) {
        activeBtn.classList.remove('bg-white/10', 'text-white/60');
        activeBtn.classList.add('text-white');
        if (filter === 'all') {
            activeBtn.classList.add('bg-white/20');
        } else if (filter === 'PENDING') {
            activeBtn.classList.add('bg-blue-500/30');
        } else if (filter === 'COMPLETED') {
            activeBtn.classList.add('bg-emerald-500/30');
        } else if (filter === 'INCOMPLETE') {
            activeBtn.classList.add('bg-red-500/30');
        }
    }

    updateSelectedDateTasks(selectedDateForSidebar);
}

// 搜索TODO
function searchTodos() {
    var keyword = document.getElementById('searchKeyword').value.toLowerCase();
    var dateFilter = document.getElementById('filterDate').value;

    if (!window._allTodos) return;

    var filteredTodos = window._allTodos;

    if (keyword) {
        filteredTodos = filteredTodos.filter(function(todo) {
            return todo.title.toLowerCase().includes(keyword) ||
                (todo.content && todo.content.toLowerCase().includes(keyword));
        });
    }

    if (dateFilter) {
        filteredTodos = filteredTodos.filter(function(todo) {
            var timeField = todo.startTime || todo.dueDate;
            return timeField && timeField.substring(0, 10) === dateFilter;
        });
        // 日期筛选时，更新左侧显示该日期的任务
        selectedDateForSidebar = dateFilter;
        updateSelectedDateTasks(dateFilter);
    } else {
        // 清除日期筛选时，恢复之前的选中状态
        updateSelectedDateTasks(selectedDateForSidebar);
    }

    // 更新月视图（搜索关键词筛选）
    if (keyword) {
        monthView.updateTodos(filteredTodos);
    } else {
        monthView.updateTodos(window._allTodos);
    }
}

// 清除筛选
function clearSearch() {
    document.getElementById('searchKeyword').value = '';
    document.getElementById('filterDate').value = '';
    currentFilter = 'all';
    selectedDateForSidebar = null;
    filterTasks('all');

    if (window._allTodos) {
        monthView.updateTodos(window._allTodos);
        updateSelectedDateTasks(null);
    }
}

// 更新统计数据
function updateStats(todos) {
    var total = todos.length;
    var completed = todos.filter(function(t) { return t.status === 'COMPLETED'; }).length;
    var pending = todos.filter(function(t) { return t.status === 'PENDING'; }).length;
    var incomplete = todos.filter(function(t) { return t.status === 'INCOMPLETE'; }).length;

    document.getElementById('statTotal').textContent = total;
    document.getElementById('statCompleted').textContent = completed;
    document.getElementById('statPending').textContent = pending;
    document.getElementById('statOverdue').textContent = incomplete;

    document.getElementById('countAll').textContent = total;
    document.getElementById('countPending').textContent = pending;
    document.getElementById('countCompleted').textContent = completed;
    document.getElementById('countOverdue').textContent = incomplete;

    var rate = total > 0 ? Math.round(completed / total * 100) : 0;
    document.getElementById('completionRate').textContent = rate + '%';
    document.getElementById('completionBar').style.width = rate + '%';
}

// 切换批量删除模式
function toggleBatchDeleteMode() {
    isBatchDeleteMode = !isBatchDeleteMode;
    var batchDeleteActions = document.getElementById('batchDeleteActions');
    var batchDeleteBtn = document.getElementById('batchDeleteBtn');

    if (isBatchDeleteMode) {
        batchDeleteActions.classList.remove('hidden');
        batchDeleteBtn.innerHTML = '<i class="ri-close-line text-red-300"></i><span>取消</span>';
    } else {
        batchDeleteActions.classList.add('hidden');
        batchDeleteBtn.innerHTML = '<i class="ri-delete-bin-line text-red-300"></i><span>批量删除</span>';
        // 取消所有勾选
        document.querySelectorAll('.todo-checkbox').forEach(function(cb) {
            cb.checked = false;
        });
    }

    // 重新渲染左侧列表
    updateSelectedDateTasks(selectedDateForSidebar);
}

// 全选/取消全选
function toggleSelectAll() {
    var checkboxes = document.querySelectorAll('.todo-checkbox');
    var allChecked = true;
    checkboxes.forEach(function(cb) {
        if (!cb.checked) allChecked = false;
    });

    checkboxes.forEach(function(cb) {
        cb.checked = !allChecked;
    });

    var selectAllBtn = document.getElementById('selectAllBtn');
    selectAllBtn.textContent = allChecked ? '全选' : '取消全选';
}

// 确认删除勾选的任务
function confirmDeleteSelected() {
    var checkboxes = document.querySelectorAll('.todo-checkbox:checked');
    var ids = Array.from(checkboxes).map(function(cb) { return parseInt(cb.value); });

    if (ids.length === 0) {
        showAlert('warning', '请先勾选要删除的任务');
        return;
    }

    if (!confirm('确定要删除选中的 ' + ids.length + ' 个任务吗？')) {
        return;
    }

    fetch('/api/todo/batchDelete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: ids })
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
        if (data.success) {
            showAlert('success', '成功删除 ' + ids.length + ' 个任务');
            // 退出批量删除模式并刷新
            toggleBatchDeleteMode();
            loadTodos();
        } else {
            showAlert('danger', data.message);
        }
    })
    .catch(function(error) {
        showAlert('danger', '批量删除失败');
    });
}

// 批量删除按钮点击 - 进入/退出批量删除模式
function batchDeleteFiltered() {
    toggleBatchDeleteMode();
}
