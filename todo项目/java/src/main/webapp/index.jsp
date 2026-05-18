<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TODO管理系统</title>
    <!-- 原生CSS -->
    <link rel="stylesheet" href="css/tailwind-converted.css">
    <link href="lib/remixicon/remixicon.css" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css">
</head>
<body class="min-h-screen app-bg font-body">
    <div class="fixed inset-0 bg-gradient-to-br from-sky-900/25 via-blue-900/15 to-indigo-900/10 pointer-events-none"></div>

    <div class="relative z-10 min-h-screen flex flex-col p-3 gap-3">
        <!-- 顶部导航 -->
        <header class="glass rounded-2xl px-5 py-3 anim-header">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <div class="w-9 h-9 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                        <i class="ri-checkbox-circle-line text-white text-lg"></i>
                    </div>
                    <h1 class="text-lg font-semibold text-white">TODO管理系统</h1>
                </div>
                <div class="flex items-center space-x-3">
                    <div class="relative">
                        <i class="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-white/50"></i>
                        <input type="text" id="searchKeyword" oninput="searchTodos()"
                            class="w-44 pl-9 pr-3 py-2 rounded-xl glass-input text-white text-sm placeholder-white/50 outline-none"
                            placeholder="搜索任务...">
                    </div>
                    <div class="flex items-center space-x-2">
                        <div class="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                            <i class="ri-user-line text-blue-200 text-sm"></i>
                        </div>
                        <span class="text-sm text-white/80" id="usernameDisplay">...</span>
                    </div>
                    <button onclick="logout()" class="btn-icon w-8 h-8 flex items-center justify-center rounded-lg text-white/70 hover:text-red-400 hover:bg-red-500/15" title="退出">
                        <i class="ri-logout-box-r-line"></i>
                    </button>
                </div>
            </div>
        </header>

        <!-- 主内容 -->
        <div class="flex-1 flex gap-3 min-h-0">
            <!-- 左侧边栏 - 任务详情 -->
            <aside class="w-72 glass rounded-2xl flex flex-col anim-left overflow-hidden min-h-0">
                <!-- 筛选标签 -->
                <div class="p-3 border-b border-white/15">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="text-sm font-semibold text-white" id="selectedDateTitle">今日任务</h3>
                        <span class="text-xs text-white/80" id="selectedDateCount">0 个</span>
                    </div>
                    <div class="flex space-x-1">
                        <button id="filter-all" onclick="filterTasks('all')" class="filter-btn flex-1 px-2 py-1 text-xs">全部</button>
                        <button id="filter-PENDING" onclick="filterTasks('PENDING')" class="filter-btn flex-1 px-2 py-1 text-xs">待完成</button>
                        <button id="filter-COMPLETED" onclick="filterTasks('COMPLETED')" class="filter-btn flex-1 px-2 py-1 text-xs">已完成</button>
                        <button id="filter-INCOMPLETE" onclick="filterTasks('INCOMPLETE')" class="filter-btn flex-1 px-2 py-1 text-xs">未完成</button>
                    </div>
                </div>

                <!-- 日期筛选 -->
                <div class="px-3 py-2 border-b border-white/15">
                    <div class="flex items-center space-x-2">
                        <input type="date" id="filterDate" onchange="searchTodos()"
                            class="flex-1 px-3 py-1.5 rounded-lg glass-input text-white text-xs outline-none">
                        <button onclick="clearSearch()" class="text-xs text-white hover:text-blue-200 transition-colors px-2 py-1 rounded-lg glass-card">清除</button>
                    </div>
                </div>

                <!-- 任务列表 -->
                <div class="flex-1 overflow-hidden p-3 min-h-0">
                    <div id="selectedDateTasks" class="task-list-container">
                        <div class="text-center py-6">
                            <i class="ri-inbox-line text-2xl text-white/30"></i>
                            <p class="text-white/60 text-sm mt-1">暂无任务</p>
                        </div>
                    </div>
                </div>

                <!-- 操作按钮 -->
                <div class="p-3 border-t border-white/15 flex-shrink-0">
                    <div class="grid grid-cols-2 gap-2 mb-2">
                        <button onclick="showAddModal()"
                            class="flex items-center justify-center space-x-1.5 px-3 py-2 text-xs text-white glass-card rounded-xl hover:bg-white/15 transition-colors">
                            <i class="ri-add-line text-blue-300"></i>
                            <span>新建</span>
                        </button>
                        <button id="batchDeleteBtn" onclick="batchDeleteFiltered()"
                            class="flex items-center justify-center space-x-1.5 px-3 py-2 text-xs text-white glass-card rounded-xl hover:bg-white/15 transition-colors">
                            <i class="ri-delete-bin-line text-red-300"></i>
                            <span>批量删除</span>
                        </button>
                    </div>
                    <!-- 批量删除模式下显示的操作 -->
                    <div id="batchDeleteActions" class="hidden">
                        <div class="grid grid-cols-2 gap-2 mb-2">
                            <button id="selectAllBtn" onclick="toggleSelectAll()"
                                class="flex items-center justify-center space-x-1.5 px-3 py-2 text-xs text-white glass-card rounded-xl hover:bg-white/15 transition-colors">
                                <i class="ri-checkbox-multiple-line text-blue-300"></i>
                                <span>全选</span>
                            </button>
                            <button id="confirmDeleteBtn" onclick="confirmDeleteSelected()"
                                class="flex items-center justify-center space-x-1.5 px-3 py-2 text-xs text-white glass-card rounded-xl hover:bg-red-500/20 transition-colors">
                                <i class="ri-delete-bin-2-line text-red-400"></i>
                                <span class="text-red-300">确认删除</span>
                            </button>
                        </div>
                    </div>
                    <div class="grid grid-cols-3 gap-2">
                        <button onclick="showUploadModal()"
                            class="flex items-center justify-center px-2 py-2 text-xs text-white/80 glass-card rounded-xl hover:bg-white/15 transition-colors">
                            <i class="ri-upload-line text-emerald-300 text-sm"></i>
                        </button>
                        <button onclick="exportCsv()"
                            class="flex items-center justify-center px-2 py-2 text-xs text-white/80 glass-card rounded-xl hover:bg-white/15 transition-colors">
                            <i class="ri-download-line text-amber-300 text-sm"></i>
                        </button>
                        <button onclick="downloadTestFile()"
                            class="flex items-center justify-center px-2 py-2 text-xs text-white/80 glass-card rounded-xl hover:bg-white/15 transition-colors">
                            <i class="ri-file-download-line text-violet-300 text-sm"></i>
                        </button>
                    </div>
                </div>
            </aside>

            <!-- 中间主日历 -->
            <main class="flex-1 glass rounded-2xl overflow-hidden anim-main">
                <div id="monthViewContainer" class="h-full overflow-auto p-5">
                    <div id="monthView"></div>
                </div>
                <div id="dayViewContainer" class="h-full overflow-auto p-5 hidden">
                    <div id="dayView"></div>
                </div>
            </main>

            <!-- 右侧 - 分类统计 -->
            <aside class="w-48 glass rounded-2xl flex flex-col anim-right overflow-hidden">
                <div class="p-4 border-b border-white/15">
                    <h3 class="text-sm font-semibold text-white mb-4">分类统计</h3>

                    <!-- 完成率 -->
                    <div class="mb-4">
                        <div class="flex items-center justify-between text-xs mb-1.5">
                            <span class="text-white/90">完成率</span>
                            <span class="text-blue-200 font-bold text-base" id="completionRate">0%</span>
                        </div>
                        <div class="w-full bg-white/20 rounded-full h-2">
                            <div id="completionBar" class="bg-gradient-to-r from-blue-400 to-blue-500 h-2 rounded-full transition-all duration-500" style="width: 0%"></div>
                        </div>
                    </div>

                    <!-- 统计数字 -->
                    <div class="grid grid-cols-2 gap-3 mb-4">
                        <div class="glass-card rounded-xl p-3 text-center">
                            <div class="text-xl font-bold text-white" id="statTotal">0</div>
                            <div class="text-xs text-white/80">总数</div>
                        </div>
                        <div class="glass-card rounded-xl p-3 text-center">
                            <div class="text-xl font-bold text-blue-200" id="statPending">0</div>
                            <div class="text-xs text-white/80">待完成</div>
                        </div>
                        <div class="glass-card rounded-xl p-3 text-center">
                            <div class="text-xl font-bold text-emerald-200" id="statCompleted">0</div>
                            <div class="text-xs text-white/80">已完成</div>
                        </div>
                        <div class="glass-card rounded-xl p-3 text-center">
                            <div class="text-xl font-bold text-red-200" id="statOverdue">0</div>
                            <div class="text-xs text-white/80">未完成</div>
                        </div>
                    </div>
                </div>

                <!-- 分类快捷筛选 -->
                <div class="p-4 flex-1">
                    <h3 class="text-xs font-semibold text-white/90 mb-3">分类筛选</h3>
                    <div class="space-y-2">
                        <button onclick="filterTasks('all')" class="w-full flex items-center justify-between px-3 py-2 glass-card rounded-xl hover:bg-white/15 transition-colors">
                            <div class="flex items-center space-x-2">
                                <span class="w-2.5 h-2.5 rounded-full bg-white/70"></span>
                                <span class="text-xs text-white/90">全部</span>
                            </div>
                            <span class="text-xs text-white/80" id="countAll">0</span>
                        </button>
                        <button onclick="filterTasks('PENDING')" class="w-full flex items-center justify-between px-3 py-2 glass-card rounded-xl hover:bg-white/15 transition-colors">
                            <div class="flex items-center space-x-2">
                                <span class="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                                <span class="text-xs text-white/90">待完成</span>
                            </div>
                            <span class="text-xs text-white/80" id="countPending">0</span>
                        </button>
                        <button onclick="filterTasks('COMPLETED')" class="w-full flex items-center justify-between px-3 py-2 glass-card rounded-xl hover:bg-white/15 transition-colors">
                            <div class="flex items-center space-x-2">
                                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                                <span class="text-xs text-white/90">已完成</span>
                            </div>
                            <span class="text-xs text-white/80" id="countCompleted">0</span>
                        </button>
                        <button onclick="filterTasks('OVERDUE')" class="w-full flex items-center justify-between px-3 py-2 glass-card rounded-xl hover:bg-white/15 transition-colors">
                            <div class="flex items-center space-x-2">
                                <span class="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                                <span class="text-xs text-white/90">未完成</span>
                            </div>
                            <span class="text-xs text-white/80" id="countOverdue">0</span>
                        </button>
                    </div>
                </div>
            </aside>
        </div>
    </div>

    <!-- AI助手 -->
    <button onclick="aiAssistant.toggle()"
        style="position:fixed; bottom:24px; right:24px; width:60px; height:60px; z-index:9999; background:linear-gradient(135deg,#60a5fa,#2563eb); color:#fff; border-radius:50%; box-shadow:0 10px 25px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; border:none; cursor:pointer; transition:transform 0.2s;"
        onmouseover="this.style.transform='scale(1.1)'"
        onmouseout="this.style.transform='scale(1)'">
        <i class="ri-robot-line" style="font-size:28px;"></i>
    </button>

    <!-- 新增/编辑模态框 -->
    <div id="todoModal" class="fixed inset-0 z-[1055] hidden flex items-center justify-center">
        <div class="absolute inset-0 modal-overlay" onclick="closeModal()"></div>
        <div class="relative w-full max-w-md mx-4">
            <div class="glass rounded-2xl shadow-2xl overflow-hidden" style="position:relative;">
                <button onclick="closeModal()" class="modal-close-btn" title="关闭">
                    <i class="ri-close-line"></i>
                </button>
                <div class="p-5 pb-3">
                    <h3 class="text-lg font-semibold" style="color:rgba(255,255,255,0.9);" id="modalTitle">新建任务</h3>
                </div>
                <form onsubmit="saveTodo(event)" class="px-5 pb-5">
                    <input type="hidden" id="todoId">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium mb-2" style="color:rgba(255,255,255,0.8);">任务标题 *</label>
                            <input type="text" id="title" required class="w-full px-4 py-2.5 rounded-xl glass-input text-white outline-none" style="color:rgba(255,255,255,0.9); placeholder-color:rgba(255,255,255,0.6);" placeholder="请输入任务标题">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-2" style="color:rgba(255,255,255,0.8);">任务内容</label>
                            <textarea id="content" rows="2" class="w-full px-4 py-2.5 rounded-xl glass-input text-white outline-none resize-none" style="color:rgba(255,255,255,0.9);" placeholder="请输入任务内容（可选）"></textarea>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium mb-2" style="color:rgba(255,255,255,0.8);">开始时间</label>
                                <input type="datetime-local" id="startTime" class="w-full px-4 py-2.5 rounded-xl glass-input text-white outline-none" style="color:rgba(255,255,255,0.9);">
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-2" style="color:rgba(255,255,255,0.8);">截止时间 *</label>
                                <input type="datetime-local" id="dueDate" required class="w-full px-4 py-2.5 rounded-xl glass-input text-white outline-none" style="color:rgba(255,255,255,0.9);">
                            </div>
                        </div>
                        <p id="timeError" class="text-xs hidden" style="font-size:12px; color:#f87171;">开始时间不能晚于截止时间</p>
                        <div>
                            <label class="block text-sm font-medium mb-2" style="color:rgba(255,255,255,0.8);">状态</label>
                            <select id="status" class="w-full px-4 py-2.5 rounded-xl glass-input text-white outline-none appearance-none" style="color:rgba(255,255,255,0.9);">
                                <option value="PENDING" class="bg-gray-800">待完成</option>
                                <option value="COMPLETED" class="bg-gray-800">已完成</option>
                                <option value="INCOMPLETE" class="bg-gray-800">未完成</option>
                            </select>
                        </div>
                    </div>
                    <div class="flex justify-end space-x-3 mt-5 pt-4 border-t border-white/15">
                        <button type="button" onclick="closeModal()" class="modal-btn-cancel">取消</button>
                        <button type="submit" id="submitBtn" class="modal-btn-save">
                            <i class="ri-save-line mr-1"></i>保存
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- 上传模态框 -->
    <div id="uploadModal" class="fixed inset-0 z-[1055] hidden flex items-center justify-center">
        <div class="absolute inset-0 modal-overlay" onclick="closeUploadModal()"></div>
        <div class="relative w-full max-w-md mx-4">
            <div class="glass rounded-2xl shadow-2xl overflow-hidden" style="position:relative;">
                <button onclick="closeUploadModal()" class="modal-close-btn" title="关闭">
                    <i class="ri-close-line"></i>
                </button>
                <div class="p-5 pb-3">
                    <h3 class="text-lg font-semibold" style="color:rgba(255,255,255,0.9);">导入CSV</h3>
                </div>
                <form onsubmit="uploadCsv(event)" enctype="multipart/form-data" class="px-5 pb-5">
                    <div class="space-y-4">
                        <div class="glass-card rounded-xl p-3">
                            <p class="text-xs" style="color:rgba(255,255,255,0.7);">格式：标题,内容,状态,开始时间,截止时间</p>
                            <p class="text-xs mt-1" style="color:rgba(255,255,255,0.5);">日期: 2026-05-17 09:00</p>
                        </div>
                        <div>
                            <input type="file" id="csvFile" accept=".csv" required class="hidden">
                            <label for="csvFile" class="flex flex-col items-center justify-center w-full h-24 border border-dashed rounded-xl cursor-pointer transition-all" style="border-color:rgba(255,255,255,0.25);" onmouseover="this.style.borderColor='rgba(96,165,250,0.4)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.25)'">
                                <i class="ri-upload-cloud-2-line text-xl mb-1" style="color:rgba(255,255,255,0.4);"></i>
                                <span class="text-xs" style="color:rgba(255,255,255,0.6);">点击选择CSV文件</span>
                                <span class="text-xs text-blue-200 mt-1" id="fileName"></span>
                            </label>
                        </div>
                    </div>
                    <div class="flex justify-end space-x-3 mt-4 pt-3 border-t border-white/15">
                        <button type="button" onclick="closeUploadModal()" class="modal-btn-cancel">取消</button>
                        <button type="submit" class="modal-btn-save">
                            <i class="ri-upload-line mr-1"></i>上传
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script src="js/app.js"></script>
    <script src="js/todo.js"></script>
    <script src="js/month-view.js"></script>
    <script src="js/day-view.js"></script>
    <script src="js/ai-assistant.js"></script>
    <script src="js/app-calendar.js"></script>
</body>
</html>
