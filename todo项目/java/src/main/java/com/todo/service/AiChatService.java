package com.todo.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.todo.model.Todo;
import com.todo.util.MimoApiClient;

import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.util.*;

/**
 * AI 聊天服务 - 强制 JSON 输出方案
 */
public class AiChatService {

    private final MimoApiClient mimoClient;
    private final TodoService todoService;
    private final ObjectMapper objectMapper;

    public AiChatService() {
        this.mimoClient = new MimoApiClient();
        this.todoService = new TodoService();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * 处理用户聊天请求
     */
    public String chat(Integer userId, String message) {
        try {
            // 1. 获取用户任务数据
            List<Todo> todos = todoService.findByUserId(userId);
            String taskContext = buildTaskContext(todos);

            // 2. 组装系统提示词（强制 JSON 输出）
            String systemPrompt = buildSystemPrompt(taskContext);

            // 3. 调用 MiMo API
            String aiResponse = mimoClient.chat(systemPrompt, message);

            // 4. 解析 AI 响应（强制 JSON 格式）
            Map<String, Object> parsed = parseAiResponse(aiResponse);

            // 5. 执行工具调用（支持单个 action 和多个 actions）
            String responseText = (String) parsed.get("response");
            boolean actionPerformed = false;

            // 检查是否有多个 actions
            Object actionsObj = parsed.get("actions");
            if (actionsObj instanceof List) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> actions = (List<Map<String, Object>>) actionsObj;
                StringBuilder results = new StringBuilder();
                for (Map<String, Object> actionItem : actions) {
                    String action = (String) actionItem.get("action");
                    @SuppressWarnings("unchecked")
                    Map<String, Object> data = (Map<String, Object>) actionItem.get("data");
                    if (action != null && !action.equals("chat") && data != null) {
                        String toolResult = executeAction(action, data, userId);
                        if (toolResult != null && !toolResult.isEmpty()) {
                            if (results.length() > 0) results.append("\n");
                            results.append(toolResult);
                        }
                        actionPerformed = true;
                    }
                }
                if (results.length() > 0) {
                    responseText = results.toString();
                }
            } else {
                // 单个 action
                String action = (String) parsed.get("action");
                @SuppressWarnings("unchecked")
                Map<String, Object> data = (Map<String, Object>) parsed.get("data");
                if (action != null && !action.equals("chat") && data != null) {
                    String toolResult = executeAction(action, data, userId);
                    if (toolResult != null && !toolResult.isEmpty()) {
                        responseText = toolResult;
                    }
                    actionPerformed = true;
                }
            }

            // 6. 返回结果
            return buildSuccessResponse(responseText != null ? responseText : "操作完成", actionPerformed);

        } catch (Exception e) {
            e.printStackTrace();
            return buildErrorResponse("AI 暂时无法响应: " + e.getMessage());
        }
    }

    /**
     * 构建系统提示词（强制 JSON 输出）
     */
    private String buildSystemPrompt(String taskContext) {
        SimpleDateFormat dateFmt = new SimpleDateFormat("yyyy-MM-dd");
        SimpleDateFormat timeFmt = new SimpleDateFormat("yyyy-MM-dd HH:mm");
        String currentDate = dateFmt.format(new Date());
        String currentTime = timeFmt.format(new Date());

        return "你是一个智能任务进度管理助手。你的职责是帮助用户高效管理任务，理解用户的自然语言意图并执行对应操作。\n\n" +
            "## 输出格式（强制约束）\n\n" +
            "你必须且只能输出以下 JSON 格式，禁止输出任何其他内容：\n\n" +
            "单个操作：{\"action\":\"操作类型\",\"data\":{...},\"response\":\"给用户的回复\"}\n" +
            "多个操作：{\"actions\":[{\"action\":\"操作类型\",\"data\":{...}},{\"action\":\"操作类型\",\"data\":{...}}],\"response\":\"给用户的回复\"}\n\n" +
            "## 强制规则\n\n" +
            "1. 全篇仅输出合法 JSON 字符串\n" +
            "2. 不添加任何描述、注释、换行说明\n" +
            "3. 字段固定不变，数据类型严格匹配\n" +
            "4. 禁止 markdown、禁止话术、禁止解释\n" +
            "5. 直接输出结果\n\n" +
            "## action 类型\n\n" +
            "1. get_task_list - 获取任务\n" +
            "   {\"action\":\"get_task_list\",\"data\":{\"filter\":\"today\"},\"response\":\"...\"}\n" +
            "   filter 可选值: all, today, week, overdue\n\n" +
            "2. create_task - 创建任务\n" +
            "   {\"action\":\"create_task\",\"data\":{\"title\":\"任务标题\",\"content\":\"任务详细内容\",\"startTime\":\"" + currentDate + "T14:00:00\",\"dueDate\":\"" + currentDate + "T18:00:00\"},\"response\":\"...\"}\n\n" +
            "3. update_task_status - 更新状态\n" +
            "   {\"action\":\"update_task_status\",\"data\":{\"taskId\":123,\"status\":\"COMPLETED\"},\"response\":\"...\"}\n" +
            "   status 可选值: PENDING, COMPLETED, INCOMPLETE\n\n" +
            "4. delete_task - 删除任务\n" +
            "   {\"action\":\"delete_task\",\"data\":{\"taskId\":123},\"response\":\"...\"}\n\n" +
            "5. chat - 普通对话\n" +
            "   {\"action\":\"chat\",\"data\":{},\"response\":\"...\"}\n\n" +
            "## 核心能力\n\n" +
            "### 1. 自然语言理解\n" +
            "你必须理解用户的各种表达方式，不要局限于固定句式。例如：\n" +
            "- \"帮我加个买菜的任务\" → create_task\n" +
            "- \"明天下午开会\" → create_task(title:开会, startTime:明天14:00, dueDate:明天15:00)\n" +
            "- \"把那个买菜的删了\" → 先查任务列表找到对应ID，再 delete_task\n" +
            "- \"学习日语，明天2点到4点\" → create_task(title:学习日语, startTime:明天14:00, dueDate:明天16:00)\n" +
            "- \"完成那个报告\" → 找到报告任务，update_task_status(COMPLETED)\n" +
            "- \"今天有什么事\" → get_task_list(today)\n\n" +
            "### 2. 时间解析规则\n" +
            "- 时间段（\"2点到4点\"、\"14:00-16:00\"）→ startTime=开始时间, dueDate=结束时间\n" +
            "- 截止时间（\"下午5点前\"）→ dueDate=该时间, startTime 省略\n" +
            "- 相对日期（\"明天\"、\"后天\"、\"下周三\"）→ 转换为具体日期\n" +
            "- 无具体时间（\"今天学习\"）→ startTime=今天09:00, dueDate=今天18:00\n" +
            "- 当用户只说\"某个时间做某事\"（如\"明天下午开会\"）→ 视为创建1小时的任务\n\n" +
            "### 3. 多任务处理\n" +
            "当用户一句话包含多个任务时，使用 actions 数组依次创建：\n" +
            "- \"帮我创建买菜和做饭的任务\" → actions: [create_task(买菜), create_task(做饭)]\n" +
            "- \"明天上午跑步，下午读书\" → actions: [create_task(跑步,上午), create_task(读书,下午)]\n\n" +
            "### 4. 任务识别\n" +
            "当用户提到任务名称但没有给出ID时，根据上下文中的任务列表匹配：\n" +
            "- 模糊匹配：用户说\"那个报告\"，找到标题包含\"报告\"的任务\n" +
            "- 如果匹配到多个，询问用户确认\n" +
            "- 如果找不到，告知用户并建议查看任务列表\n\n" +
            "### 5. 删除任务的多种表达\n" +
            "理解用户的删除意图：\n" +
            "- \"删掉买菜任务\" / \"把买菜的删了\" / \"不要买菜了\" / \"取消买菜\" → delete_task\n" +
            "- \"清空所有任务\" → 逐个删除所有任务\n" +
            "- \"删掉已完成的任务\" → 找到已完成的逐个删除\n\n" +
            "## 回复风格\n\n" +
            "当用户查询任务时，response 应包含：\n" +
            "1. 任务清单（列出任务名称、状态、时间）\n" +
            "2. 进度分析（完成率、待办数量等）\n" +
            "3. 合理建议（优先处理什么、时间安排建议等）\n" +
            "4. 鼓励语（积极正面的反馈）\n\n" +
            "当用户创建任务时，response 应确认任务信息并给予鼓励。\n" +
            "当用户删除任务时，response 应确认删除并简要说明。\n" +
            "当用户更新任务状态时，response 应确认状态变更并给予正面反馈。\n\n" +
            "## 当前时间\n" +
            currentDate + " " + currentTime + "\n\n" +
            "## 当前任务上下文\n" + taskContext;
    }

    /**
     * 解析 AI 响应（强制 JSON）
     */
    private Map<String, Object> parseAiResponse(String response) {
        if (response == null || response.isEmpty()) {
            return createDefaultResponse("AI 返回内容为空");
        }

        String cleaned = response.trim();

        // 移除 markdown 代码块标记
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.replaceFirst("^```json\\s*", "").replaceFirst("\\s*```$", "");
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.replaceFirst("^```\\s*", "").replaceFirst("\\s*```$", "");
        }

        // 1. 尝试直接解析 JSON
        try {
            Map<String, Object> result = objectMapper.readValue(cleaned, new TypeReference<Map<String, Object>>() {});
            if (!result.containsKey("action") && !result.containsKey("actions")) result.put("action", "chat");
            if (!result.containsKey("data") && !result.containsKey("actions")) result.put("data", new HashMap<>());
            if (!result.containsKey("response")) result.put("response", "");
            return result;
        } catch (Exception e1) {
            // 继续
        }

        // 2. 提取 JSON 部分
        try {
            int start = cleaned.indexOf('{');
            int end = cleaned.lastIndexOf('}');
            if (start >= 0 && end > start) {
                String jsonPart = cleaned.substring(start, end + 1);
                Map<String, Object> result = objectMapper.readValue(jsonPart, new TypeReference<Map<String, Object>>() {});
                if (!result.containsKey("action") && !result.containsKey("actions")) result.put("action", "chat");
                if (!result.containsKey("data") && !result.containsKey("actions")) result.put("data", new HashMap<>());
                if (!result.containsKey("response")) result.put("response", "");
                return result;
            }
        } catch (Exception e2) {
            // 继续
        }

        // 3. 返回默认
        return createDefaultResponse(cleaned);
    }

    private Map<String, Object> createDefaultResponse(String responseText) {
        Map<String, Object> defaultResponse = new LinkedHashMap<>();
        defaultResponse.put("action", "chat");
        defaultResponse.put("data", new HashMap<>());
        defaultResponse.put("response", responseText);
        return defaultResponse;
    }

    /**
     * 执行工具调用
     */
    private String executeAction(String action, Map<String, Object> data, Integer userId) {
        try {
            switch (action) {
                case "get_task_list":
                    return executeGetTaskList(data, userId);
                case "create_task":
                    return executeCreateTask(data, userId);
                case "update_task_status":
                    return executeUpdateTaskStatus(data, userId);
                case "delete_task":
                    return executeDeleteTask(data, userId);
                default:
                    return "未知的操作: " + action;
            }
        } catch (Exception e) {
            return "操作失败: " + e.getMessage();
        }
    }

    // ===== 任务操作方法 =====

    private String buildTaskContext(List<Todo> todos) {
        if (todos == null || todos.isEmpty()) {
            return "当前没有任何任务。";
        }

        StringBuilder sb = new StringBuilder();
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm");

        long pendingCount = todos.stream().filter(t -> "PENDING".equals(t.getStatus())).count();
        long completedCount = todos.stream().filter(t -> "COMPLETED".equals(t.getStatus())).count();
        long incompleteCount = todos.stream().filter(t -> "INCOMPLETE".equals(t.getStatus())).count();
        int total = todos.size();

        sb.append("任务总数: ").append(total).append("\n");
        sb.append("待完成: ").append(pendingCount)
          .append(", 已完成: ").append(completedCount)
          .append(", 未完成: ").append(incompleteCount).append("\n");
        if (total > 0) {
            sb.append("完成率: ").append(completedCount * 100 / total).append("%\n");
        }
        sb.append("\n");

        sb.append("任务列表:\n");
        int count = 0;
        for (Todo todo : todos) {
            if (count >= 15) break;
            sb.append("- [").append(getStatusText(todo.getStatus())).append("] ");
            sb.append(todo.getTitle());
            if (todo.getContent() != null && !todo.getContent().isEmpty()) {
                sb.append(" - ").append(todo.getContent());
            }
            if (todo.getStartTime() != null) {
                sb.append(" (开始: ").append(sdf.format(todo.getStartTime()));
                if (todo.getDueDate() != null) {
                    sb.append(", 截止: ").append(sdf.format(todo.getDueDate()));
                }
                sb.append(")");
            } else if (todo.getDueDate() != null) {
                sb.append(" (截止: ").append(sdf.format(todo.getDueDate())).append(")");
            }
            sb.append(" [ID:").append(todo.getId()).append("]");
            sb.append("\n");
            count++;
        }

        return sb.toString();
    }

    private String executeGetTaskList(Map<String, Object> data, Integer userId) {
        List<Todo> todos = todoService.findByUserId(userId);
        String filter = (String) data.getOrDefault("filter", "all");

        List<Todo> filtered = new ArrayList<>();
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
        SimpleDateFormat timeSdf = new SimpleDateFormat("yyyy-MM-dd HH:mm");
        String today = sdf.format(new Date());

        Calendar cal = Calendar.getInstance();
        cal.set(Calendar.DAY_OF_WEEK, Calendar.MONDAY);
        String weekStart = sdf.format(cal.getTime());
        cal.add(Calendar.DAY_OF_WEEK, 6);
        String weekEnd = sdf.format(cal.getTime());

        for (Todo todo : todos) {
            String dueDateStr = todo.getDueDate() != null ? sdf.format(todo.getDueDate()) : null;
            switch (filter) {
                case "today":
                    if (dueDateStr != null && dueDateStr.equals(today)) {
                        filtered.add(todo);
                    }
                    break;
                case "week":
                    if (dueDateStr != null && dueDateStr.compareTo(weekStart) >= 0 && dueDateStr.compareTo(weekEnd) <= 0) {
                        filtered.add(todo);
                    }
                    break;
                case "overdue":
                    if ("INCOMPLETE".equals(todo.getStatus())) {
                        filtered.add(todo);
                    }
                    break;
                default:
                    filtered.add(todo);
            }
        }

        if (filtered.isEmpty()) {
            return getEmptyMessage(filter);
        }

        StringBuilder sb = new StringBuilder();
        sb.append(getFilterTitle(filter)).append("：\n");
        for (Todo todo : filtered) {
            String statusIcon = getStatusIcon(todo.getStatus());
            sb.append(statusIcon).append(" ").append(todo.getTitle());
            if (todo.getStartTime() != null) {
                sb.append(" (开始: ").append(timeSdf.format(todo.getStartTime()));
                if (todo.getDueDate() != null) {
                    sb.append(", 截止: ").append(timeSdf.format(todo.getDueDate()));
                }
                sb.append(")");
            } else if (todo.getDueDate() != null) {
                sb.append(" (截止: ").append(timeSdf.format(todo.getDueDate())).append(")");
            }
            if (todo.getContent() != null && !todo.getContent().isEmpty()) {
                sb.append(" - ").append(todo.getContent());
            }
            sb.append(" [ID:").append(todo.getId()).append("]");
            sb.append("\n");
        }
        return sb.toString();
    }

    private String getFilterTitle(String filter) {
        switch (filter) {
            case "today": return "今日任务";
            case "week": return "本周任务";
            case "overdue": return "已过期任务";
            default: return "所有任务";
        }
    }

    private String getEmptyMessage(String filter) {
        switch (filter) {
            case "today": return "今天没有任务，您可以享受轻松的一天！";
            case "week": return "本周没有任务安排。";
            case "overdue": return "没有过期的任务，做得很好！";
            default: return "暂无任务。";
        }
    }

    private String getStatusIcon(String status) {
        switch (status) {
            case "COMPLETED": return "✅";
            case "PENDING": return "⬜";
            case "INCOMPLETE": return "❌";
            default: return "⬜";
        }
    }

    private String getStatusText(String status) {
        switch (status) {
            case "PENDING": return "待完成";
            case "COMPLETED": return "已完成";
            case "INCOMPLETE": return "未完成";
            default: return status;
        }
    }

    private String executeCreateTask(Map<String, Object> data, Integer userId) {
        String title = (String) data.get("title");
        if (title == null || title.isEmpty()) {
            return "任务标题不能为空";
        }

        String content = (String) data.get("content");
        String startTimeStr = (String) data.get("startTime");
        String dueDateStr = (String) data.get("dueDate");

        Timestamp startTime = null;
        if (startTimeStr != null && !startTimeStr.isEmpty()) {
            try {
                startTime = Timestamp.valueOf(startTimeStr.replace("T", " ").substring(0, 19));
            } catch (Exception e) {
                // 日期解析失败，忽略
            }
        }

        Timestamp dueDate = null;
        if (dueDateStr != null && !dueDateStr.isEmpty()) {
            try {
                dueDate = Timestamp.valueOf(dueDateStr.replace("T", " ").substring(0, 19));
            } catch (Exception e) {
                // 日期解析失败，忽略
            }
        }

        Todo todo = todoService.addTodo(userId, title, content, "PENDING", startTime, dueDate);
        return "✅ 任务已创建: " + todo.getTitle() + " [ID:" + todo.getId() + "]";
    }

    private String executeUpdateTaskStatus(Map<String, Object> data, Integer userId) {
        Object taskIdObj = data.get("taskId");
        Integer taskId = taskIdObj instanceof Number ? ((Number) taskIdObj).intValue() : null;
        if (taskId == null) {
            return "任务 ID 不能为空";
        }

        String status = (String) data.get("status");
        if (status == null || status.isEmpty()) {
            return "状态不能为空";
        }

        try {
            Todo existingTodo = todoService.findById(taskId);
            if (existingTodo == null) {
                return "任务不存在";
            }
            if (!existingTodo.getUserId().equals(userId)) {
                return "无权修改此任务";
            }

            todoService.updateTodo(taskId, userId,
                existingTodo.getTitle(),
                existingTodo.getContent(),
                status,
                existingTodo.getStartTime(),
                existingTodo.getDueDate());

            return "✅ 任务状态已更新为: " + getStatusText(status);
        } catch (Exception e) {
            return "更新失败: " + e.getMessage();
        }
    }

    private String executeDeleteTask(Map<String, Object> data, Integer userId) {
        Object taskIdObj = data.get("taskId");
        Integer taskId = taskIdObj instanceof Number ? ((Number) taskIdObj).intValue() : null;
        if (taskId == null) {
            return "任务 ID 不能为空";
        }

        try {
            todoService.deleteTodo(taskId, userId);
            return "✅ 任务已删除";
        } catch (Exception e) {
            return "删除失败: " + e.getMessage();
        }
    }

    private String buildSuccessResponse(String message, boolean actionPerformed) {
        try {
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("success", true);
            result.put("message", message);
            result.put("actionPerformed", actionPerformed);
            return objectMapper.writeValueAsString(result);
        } catch (Exception e) {
            return "{\"success\":true,\"message\":\"" + message.replace("\"", "\\\"") + "\",\"actionPerformed\":" + actionPerformed + "}";
        }
    }

    private String buildErrorResponse(String message) {
        try {
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("success", false);
            result.put("message", message);
            return objectMapper.writeValueAsString(result);
        } catch (Exception e) {
            return "{\"success\":false,\"message\":\"" + message.replace("\"", "\\\"") + "\"}";
        }
    }
}
