// TODO管理相关功能

// 状态映射
const STATUS_MAP = {
    'PENDING': '待完成',
    'COMPLETED': '已完成',
    'INCOMPLETE': '未完成'
};

// 状态颜色映射 - 用于月表和左侧列表
const STATUS_COLORS = {
    'PENDING': { bg: 'bg-blue-500/30', text: 'text-blue-100', border: 'border-blue-400/50', dot: 'bg-blue-400' },
    'COMPLETED': { bg: 'bg-emerald-500/30', text: 'text-emerald-100', border: 'border-emerald-400/50', dot: 'bg-emerald-400' },
    'INCOMPLETE': { bg: 'bg-red-500/30', text: 'text-red-100', border: 'border-red-400/50', dot: 'bg-red-400' }
};

// 任务颜色（用于日历区分不同任务）- 保留用于特殊场景
const TASK_COLORS = [
    { bg: 'bg-sky-500/30', border: 'border-sky-400/50', text: 'text-sky-100', dot: 'bg-sky-400' },
    { bg: 'bg-emerald-500/30', border: 'border-emerald-400/50', text: 'text-emerald-100', dot: 'bg-emerald-400' },
    { bg: 'bg-violet-500/30', border: 'border-violet-400/50', text: 'text-violet-100', dot: 'bg-violet-400' },
    { bg: 'bg-amber-500/30', border: 'border-amber-400/50', text: 'text-amber-100', dot: 'bg-amber-400' },
    { bg: 'bg-rose-500/30', border: 'border-rose-400/50', text: 'text-rose-100', dot: 'bg-rose-400' },
    { bg: 'bg-teal-500/30', border: 'border-teal-400/50', text: 'text-teal-100', dot: 'bg-teal-400' },
    { bg: 'bg-fuchsia-500/30', border: 'border-fuchsia-400/50', text: 'text-fuchsia-100', dot: 'bg-fuchsia-400' },
    { bg: 'bg-orange-500/30', border: 'border-orange-400/50', text: 'text-orange-100', dot: 'bg-orange-400' }
];

function getTaskColor(todoId) {
    return TASK_COLORS[todoId % TASK_COLORS.length];
}

// 获取状态对应的颜色
function getStatusColor(status) {
    return STATUS_COLORS[status] || STATUS_COLORS['PENDING'];
}

// 检查并更新过期状态 - 仅PENDING+过期→INCOMPLETE，COMPLETED保持不变
var _lastOverdueCheckTime = 0;

function checkOverdueStatus(todos) {
    var now = new Date();
    return todos.map(function(todo) {
        if (todo.dueDate && todo.status === 'PENDING') {
            var dueDate = new Date(todo.dueDate);
            if (dueDate < now) {
                todo.status = 'INCOMPLETE';
            }
        }
        return todo;
    });
}

// 加载TODO列表
function loadTodos() {
    fetch('/api/todo/list')
        .then(function(response) { return response.json(); })
        .then(function(data) {
            if (data.success) {
                window._allTodos = checkOverdueStatus(data.data);
                updateStats(window._allTodos);
                if (window.monthView) {
                    window.monthView.updateTodos(window._allTodos);
                }
                if (window.dayView) {
                    window.dayView.updateTodos(window._allTodos);
                }
                // 更新左侧任务列表 - 使用当前选中的日期
                if (typeof updateSelectedDateTasks === 'function') {
                    var selectedDate = null;
                    if (typeof selectedDateForSidebar !== 'undefined') {
                        selectedDate = selectedDateForSidebar;
                    } else if (window.dayView) {
                        selectedDate = formatDateStr(window.dayView.selectedDate);
                    }
                    updateSelectedDateTasks(selectedDate);
                }
            } else {
                showAlert('danger', data.message);
            }
        })
        .catch(function(error) {
            showAlert('danger', '加载TODO列表失败');
        });
}

// 定时检测过期状态（每60秒），带时间戳去重
setInterval(function() {
    if (window._allTodos && window._allTodos.length > 0) {
        var now = new Date();
        // 去重：距离上次检测不足1分钟则跳过
        if (now.getTime() - _lastOverdueCheckTime < 60000) return;
        _lastOverdueCheckTime = now.getTime();

        var hasChanged = false;
        window._allTodos.forEach(function(todo) {
            if (todo.dueDate && todo.status === 'PENDING') {
                var dueDate = new Date(todo.dueDate);
                if (dueDate < now) {
                    todo.status = 'INCOMPLETE';
                    hasChanged = true;
                }
            }
        });
        if (hasChanged) {
            // 同步到后端
            fetch('/api/todo/list').then(function(r){return r.json();}).then(function(d){
                if(d.success){window._allTodos = checkOverdueStatus(d.data);}
            }).catch(function(){
                showAlert('danger', '状态更新失败，请重试');
            });
            // 刷新视图
            if (window.monthView) window.monthView.updateTodos(window._allTodos);
            if (window.dayView) window.dayView.updateTodos(window._allTodos);
            if (typeof updateSelectedDateTasks === 'function') {
                var sel = typeof selectedDateForSidebar !== 'undefined' ? selectedDateForSidebar : null;
                updateSelectedDateTasks(sel);
            }
        }
    }
}, 60000);

// 显示新增模态框
function showAddModal(prefillDate) {
    document.getElementById('modalTitle').textContent = '新建任务';
    document.getElementById('todoId').value = '';
    document.getElementById('title').value = '';
    document.getElementById('content').value = '';
    document.getElementById('status').value = 'PENDING';
    document.getElementById('status').disabled = true; // 新增时禁用状态选择

    if (prefillDate) {
        // prefillDate格式: yyyy-MM-ddTHH:mm
        document.getElementById('startTime').value = prefillDate;
        document.getElementById('dueDate').value = prefillDate;
    } else {
        document.getElementById('startTime').value = '';
        document.getElementById('dueDate').value = '';
    }

    var modal = document.getElementById('todoModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        modal.style.opacity = '1';
        // 重置时间验证状态
        var errorEl = document.getElementById('timeError');
        var submitBtn = document.getElementById('submitBtn');
        if (errorEl) errorEl.classList.add('hidden');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }
}
function closeModal() {
    var modal = document.getElementById('todoModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}

// 编辑TODO
function editTodo(id) {
    fetch('/api/todo/get/' + id)
        .then(function(response) { return response.json(); })
        .then(function(data) {
            if (data.success) {
                var todo = data.data;
                document.getElementById('modalTitle').textContent = '编辑任务';
                document.getElementById('todoId').value = todo.id;
                document.getElementById('title').value = todo.title;
                document.getElementById('content').value = todo.content || '';
                document.getElementById('status').value = todo.status || 'PENDING';
                document.getElementById('status').disabled = false; // 编辑时启用状态选择

                // 转换startTime为datetime-local格式 (yyyy-MM-ddTHH:mm)
                if (todo.startTime) {
                    document.getElementById('startTime').value = toDatetimeLocal(todo.startTime);
                } else {
                    document.getElementById('startTime').value = '';
                }

                // 转换dueDate为datetime-local格式
                if (todo.dueDate) {
                    document.getElementById('dueDate').value = toDatetimeLocal(todo.dueDate);
                } else {
                    document.getElementById('dueDate').value = '';
                }

                var modal = document.getElementById('todoModal');
                if (modal) {
                    modal.classList.remove('hidden');
                    modal.style.display = 'flex';
                    modal.style.opacity = '1';
                    // 重置时间验证状态
                    var errorEl = document.getElementById('timeError');
                    var submitBtn = document.getElementById('submitBtn');
                    if (errorEl) errorEl.classList.add('hidden');
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                    }
                }
            } else {
                showAlert('danger', data.message);
            }
        })
        .catch(function(error) {
            showAlert('danger', '获取TODO详情失败');
        });
}

// 将后端返回的时间字符串转为datetime-local格式 (yyyy-MM-ddTHH:mm)
function toDatetimeLocal(dateStr) {
    if (!dateStr) return '';
    // 后端返回格式: yyyy-MM-ddTHH:mm:ss 或 yyyy-MM-ddTHH:mm
    // datetime-local需要: yyyy-MM-ddTHH:mm
    if (dateStr.length >= 16) {
        return dateStr.substring(0, 16);
    }
    return dateStr;
}

// 格式化日期为datetime-local格式
function formatDateLocal(d) {
    return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0') + 'T' +
        String(d.getHours()).padStart(2, '0') + ':' +
        String(d.getMinutes()).padStart(2, '0');
}

// 保存TODO
function saveTodo(event) {
    event.preventDefault();

    var id = document.getElementById('todoId').value;
    var title = document.getElementById('title').value.trim();
    var content = document.getElementById('content').value.trim();
    var status = document.getElementById('status').value;
    var startTime = document.getElementById('startTime').value;
    var dueDate = document.getElementById('dueDate').value;

    if (!title) {
        showAlert('danger', '标题不能为空');
        return;
    }

    if (!dueDate) {
        showAlert('danger', '请选择截止时间');
        return;
    }

    // 如果没有设置开始时间，使用截止时间
    if (!startTime) {
        startTime = dueDate;
    }

    // 验证开始时间不能晚于截止时间
    if (new Date(startTime) > new Date(dueDate)) {
        showAlert('danger', '开始时间不能晚于截止时间，请检查时间设置');
        return;
    }

    // 确保时间格式正确：yyyy-MM-ddTHH:mm
    // 后端parseTimestamp会处理T转空格

    var url = id ? '/api/todo/update' : '/api/todo/add';
    var data = {
        title: title,
        content: content,
        status: status,
        startTime: startTime,
        dueDate: dueDate
    };

    if (id) {
        data.id = parseInt(id);
    }

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(function(response) { return response.json(); })
    .then(function(result) {
        if (result.success) {
            showAlert('success', result.message);
            closeModal();
            loadTodos();
        } else {
            showAlert('danger', result.message);
        }
    })
    .catch(function(error) {
        showAlert('danger', '保存TODO失败');
    });
}

// 删除TODO
function deleteTodo(id) {
    if (!confirm('确定要删除这个任务吗？')) return;

    fetch('/api/todo/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id })
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
        if (data.success) {
            showAlert('success', data.message);
            loadTodos();
        } else {
            showAlert('danger', data.message);
        }
    })
    .catch(function(error) {
        showAlert('danger', '删除TODO失败');
    });
}

// 显示上传模态框
function showUploadModal() {
    document.getElementById('csvFile').value = '';
    document.getElementById('fileName').textContent = '';
    var modal = document.getElementById('uploadModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }
}

// 关闭上传模态框
function closeUploadModal() {
    var modal = document.getElementById('uploadModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}

// 文件选择事件
document.addEventListener('DOMContentLoaded', function() {
    var csvFile = document.getElementById('csvFile');
    if (csvFile) {
        csvFile.addEventListener('change', function() {
            var fileName = this.files[0] ? this.files[0].name : '';
            document.getElementById('fileName').textContent = fileName;
        });
    }

    // 时间输入实时验证
    var startTimeInput = document.getElementById('startTime');
    var dueDateInput = document.getElementById('dueDate');
    if (startTimeInput && dueDateInput) {
        startTimeInput.addEventListener('change', validateTimeRange);
        dueDateInput.addEventListener('change', validateTimeRange);
    }
});

// 实时验证开始时间不能晚于截止时间
function validateTimeRange() {
    var startTime = document.getElementById('startTime').value;
    var dueDate = document.getElementById('dueDate').value;
    var errorEl = document.getElementById('timeError');
    var submitBtn = document.getElementById('submitBtn');

    if (startTime && dueDate && new Date(startTime) > new Date(dueDate)) {
        errorEl.classList.remove('hidden');
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        errorEl.classList.add('hidden');
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

// 上传CSV
function uploadCsv(event) {
    event.preventDefault();
    var fileInput = document.getElementById('csvFile');
    var file = fileInput.files[0];

    if (!file) {
        showAlert('danger', '请选择CSV文件');
        return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
        showAlert('danger', '请选择CSV格式的文件');
        return;
    }

    var formData = new FormData();
    formData.append('file', file);

    fetch('/api/upload/csv', {
        method: 'POST',
        body: formData
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
        if (data.success) {
            showAlert('success', data.message);
            closeUploadModal();
            loadTodos();
        } else {
            showAlert('danger', data.message);
        }
    })
    .catch(function(error) {
        showAlert('danger', '上传CSV失败');
    });
}

// 导出CSV
function exportCsv() {
    window.location.href = '/api/todo/export';
}

// 下载测试文件 - 覆盖四个时间段
function downloadTestFile() {
    var today = new Date();
    var dates = [];
    for (var i = -2; i <= 5; i++) {
        var d = new Date(today);
        d.setDate(d.getDate() + i);
        dates.push(formatDateStr(d));
    }

    var testContent = '标题,内容,状态,开始时间,截止时间\n';
    // 深夜 00:00-06:00
    testContent += '系统日志检查,检查服务器运行状态,PENDING,' + dates[0] + ' 02:00,' + dates[0] + ' 04:00\n';
    testContent += '夜间值班记录,填写值班日志,PENDING,' + dates[1] + ' 03:00,' + dates[1] + ' 05:00\n';
    // 早上 06:00-12:00
    testContent += '学习Python基础,学习变量和数据类型,PENDING,' + dates[0] + ' 08:00,' + dates[0] + ' 10:00\n';
    testContent += '阅读技术书籍,阅读设计模式,PENDING,' + dates[1] + ' 09:00,' + dates[1] + ' 11:00\n';
    testContent += '数据库优化,优化SQL查询性能,PENDING,' + dates[2] + ' 10:00,' + dates[2] + ' 12:00\n';
    testContent += '写单元测试,编写测试用例,PENDING,' + dates[3] + ' 09:00,' + dates[3] + ' 11:00\n';
    testContent += '整理房间,打扫和整理,COMPLETED,' + dates[5] + ' 09:00,' + dates[5] + ' 11:00\n';
    // 下午 12:00-18:00
    testContent += '完成项目报告,整理项目文档,PENDING,' + dates[0] + ' 14:00,' + dates[0] + ' 17:00\n';
    testContent += '代码审查,审查团队代码,PENDING,' + dates[1] + ' 15:00,' + dates[1] + ' 17:00\n';
    testContent += '前端开发,开发用户管理页面,PENDING,' + dates[2] + ' 14:00,' + dates[2] + ' 18:00\n';
    testContent += '部署测试环境,部署到测试服务器,PENDING,' + dates[3] + ' 16:00,' + dates[3] + ' 18:00\n';
    testContent += '完成需求文档,编写产品需求文档,COMPLETED,' + dates[5] + ' 15:00,' + dates[5] + ' 17:00\n';
    // 晚上 18:00-24:00
    testContent += '团队周会,准备周会汇报材料,PENDING,' + dates[0] + ' 19:00,' + dates[0] + ' 21:00\n';
    testContent += '健身锻炼,去健身房跑步,PENDING,' + dates[1] + ' 20:00,' + dates[1] + ' 22:00\n';
    testContent += '晚间学习,学习新技术框架,PENDING,' + dates[2] + ' 21:00,' + dates[2] + ' 23:00\n';
    testContent += '写周报,总结本周工作,COMPLETED,' + dates[4] + ' 22:00,' + dates[4] + ' 23:00\n';

    var blob = new Blob(['﻿' + testContent], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement('a');
    var url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'todo-test-import.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showAlert('success', '测试文件下载成功！包含16条任务，覆盖四个时间段');
}

// HTML转义
function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 格式化日期为 YYYY-MM-DD
function formatDateStr(date) {
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
}

// 格式化时间 HH:mm
function formatTime(dateString) {
    if (!dateString) return '';
    var date = new Date(dateString);
    return String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
}
