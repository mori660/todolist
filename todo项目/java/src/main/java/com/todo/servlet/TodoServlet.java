package com.todo.servlet;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.todo.model.Todo;
import com.todo.service.TodoService;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.BufferedReader;
import java.io.IOException;
import java.sql.Timestamp;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@WebServlet("/api/todo/*")
public class TodoServlet extends HttpServlet {
    private TodoService todoService = new TodoService();
    private ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 从session获取当前用户ID
     */
    private Integer getCurrentUserId(HttpServletRequest request) throws Exception {
        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            throw new Exception("未登录");
        }
        return (Integer) session.getAttribute("userId");
    }

    /**
     * 解析日期字符串为Timestamp
     */
    private Timestamp parseTimestamp(String dateStr) {
        if (dateStr == null || dateStr.isEmpty()) {
            return null;
        }
        try {
            // 处理 datetime-local 格式: yyyy-MM-ddTHH:mm
            if (dateStr.contains("T")) {
                dateStr = dateStr.replace("T", " ");
                if (dateStr.length() == 16) {
                    dateStr += ":00";
                }
            }
            // 优先尝试带时间的格式（避免SimpleDateFormat忽略时间部分）
            try {
                SimpleDateFormat sdf1 = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
                sdf1.setLenient(false);
                return new Timestamp(sdf1.parse(dateStr).getTime());
            } catch (ParseException e1) {
                // 尝试 yyyy-MM-dd HH:mm 格式
                try {
                    SimpleDateFormat sdf2 = new SimpleDateFormat("yyyy-MM-dd HH:mm");
                    sdf2.setLenient(false);
                    return new Timestamp(sdf2.parse(dateStr).getTime());
                } catch (ParseException e2) {
                    // 最后尝试纯日期格式
                    SimpleDateFormat sdf3 = new SimpleDateFormat("yyyy-MM-dd");
                    sdf3.setLenient(false);
                    return new Timestamp(sdf3.parse(dateStr).getTime());
                }
            }
        } catch (ParseException e) {
            return null;
        }
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        Map<String, Object> result = new HashMap<>();

        try {
            Integer userId = getCurrentUserId(request);
            String pathInfo = request.getPathInfo();

            if (pathInfo == null || "/list".equals(pathInfo)) {
                // 查询TODO列表前先更新过期状态
                try {
                    todoService.updateOverdueStatus(userId);
                } catch (Exception e) {
                    // 更新过期状态失败不影响列表查询
                }
                // 查询TODO列表
                List<Todo> todoList = todoService.findByUserId(userId);
                result.put("success", true);
                result.put("data", todoList);
            } else if (pathInfo.startsWith("/get/")) {
                // 查询单个TODO
                Integer id = Integer.parseInt(pathInfo.substring(5));
                Todo todo = todoService.findById(id);
                if (todo != null && todo.getUserId().equals(userId)) {
                    result.put("success", true);
                    result.put("data", todo);
                } else {
                    result.put("success", false);
                    result.put("message", "TODO不存在或无权访问");
                }
            } else if ("/export".equals(pathInfo)) {
                // 导出CSV
                List<Todo> todoList = todoService.exportTodos(userId);
                exportCsv(response, todoList);
                return;
            } else {
                result.put("success", false);
                result.put("message", "未知的操作");
            }
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", e.getMessage());
        }

        response.getWriter().write(objectMapper.writeValueAsString(result));
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        Map<String, Object> result = new HashMap<>();

        try {
            Integer userId = getCurrentUserId(request);
            String pathInfo = request.getPathInfo();

            if ("/add".equals(pathInfo)) {
                // 新增TODO
                BufferedReader reader = request.getReader();
                Map<String, Object> params = objectMapper.readValue(reader, Map.class);

                String title = (String) params.get("title");
                String content = (String) params.get("content");
                String startTimeStr = (String) params.get("startTime");
                String dueDateStr = (String) params.get("dueDate");
                String status = (String) params.get("status");

                if (title == null || title.trim().isEmpty()) {
                    result.put("success", false);
                    result.put("message", "标题不能为空");
                } else {
                    Timestamp startTime = parseTimestamp(startTimeStr);
                    Timestamp dueDate = parseTimestamp(dueDateStr);
                    Todo todo = todoService.addTodo(userId, title, content, status, startTime, dueDate);
                    result.put("success", true);
                    result.put("message", "添加成功");
                    result.put("data", todo);
                }
            } else if ("/update".equals(pathInfo)) {
                // 更新TODO
                BufferedReader reader = request.getReader();
                Map<String, Object> params = objectMapper.readValue(reader, Map.class);

                Integer id = (Integer) params.get("id");
                String title = (String) params.get("title");
                String content = (String) params.get("content");
                String startTimeStr = (String) params.get("startTime");
                String dueDateStr = (String) params.get("dueDate");
                String status = (String) params.get("status");

                if (id == null) {
                    result.put("success", false);
                    result.put("message", "TODO ID不能为空");
                } else if (title == null || title.trim().isEmpty()) {
                    result.put("success", false);
                    result.put("message", "标题不能为空");
                } else {
                    Timestamp startTime = parseTimestamp(startTimeStr);
                    Timestamp dueDate = parseTimestamp(dueDateStr);
                    Todo todo = todoService.updateTodo(id, userId, title, content, status, startTime, dueDate);
                    result.put("success", true);
                    result.put("message", "更新成功");
                    result.put("data", todo);
                }
            } else if ("/delete".equals(pathInfo)) {
                // 删除TODO
                BufferedReader reader = request.getReader();
                Map<String, Object> params = objectMapper.readValue(reader, Map.class);

                Integer id = (Integer) params.get("id");
                if (id == null) {
                    result.put("success", false);
                    result.put("message", "TODO ID不能为空");
                } else {
                    todoService.deleteTodo(id, userId);
                    result.put("success", true);
                    result.put("message", "删除成功");
                }
            } else if ("/batchDelete".equals(pathInfo)) {
                // 批量删除TODO
                BufferedReader reader = request.getReader();
                Map<String, Object> params = objectMapper.readValue(reader, Map.class);

                List<Integer> ids = (List<Integer>) params.get("ids");
                if (ids == null || ids.isEmpty()) {
                    result.put("success", false);
                    result.put("message", "请选择要删除的TODO");
                } else {
                    int count = todoService.batchDelete(ids, userId);
                    result.put("success", true);
                    result.put("message", "成功删除 " + count + " 条记录");
                }
            } else {
                result.put("success", false);
                result.put("message", "未知的操作");
            }
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", e.getMessage());
        }

        response.getWriter().write(objectMapper.writeValueAsString(result));
    }

    /**
     * 导出CSV文件
     */
    private void exportCsv(HttpServletResponse response, List<Todo> todoList) throws IOException {
        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=\"todos.csv\"");

        StringBuilder csv = new StringBuilder();
        csv.append("﻿"); // UTF-8 BOM
        csv.append("标题,内容,状态,开始时间,截止时间\n");

        for (Todo todo : todoList) {
            csv.append(escapeCsv(todo.getTitle())).append(",");
            csv.append(escapeCsv(todo.getContent() != null ? todo.getContent() : "")).append(",");
            csv.append(escapeCsv(todo.getStatus() != null ? todo.getStatus() : "PENDING")).append(",");
            csv.append(todo.getStartTime() != null ? todo.getStartTime().toString().substring(0, 16) : "").append(",");
            csv.append(todo.getDueDate() != null ? todo.getDueDate().toString().substring(0, 16) : "").append("\n");
        }

        response.getWriter().write(csv.toString());
    }

    /**
     * CSV字段转义
     */
    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
