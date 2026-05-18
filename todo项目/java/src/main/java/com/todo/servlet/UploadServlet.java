package com.todo.servlet;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvValidationException;
import com.todo.model.Todo;
import com.todo.service.TodoService;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.servlet.http.Part;

import java.io.IOException;
import java.io.InputStreamReader;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@WebServlet("/api/upload/csv")
@MultipartConfig(
    fileSizeThreshold = 1024 * 1024, // 1 MB
    maxFileSize = 1024 * 1024 * 10,  // 10 MB
    maxRequestSize = 1024 * 1024 * 50 // 50 MB
)
public class UploadServlet extends HttpServlet {
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
            // 优先尝试带时间的格式
            try {
                SimpleDateFormat sdf1 = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
                sdf1.setLenient(false);
                return new Timestamp(sdf1.parse(dateStr).getTime());
            } catch (Exception e1) {
                try {
                    SimpleDateFormat sdf2 = new SimpleDateFormat("yyyy-MM-dd HH:mm");
                    sdf2.setLenient(false);
                    return new Timestamp(sdf2.parse(dateStr).getTime());
                } catch (Exception e2) {
                    SimpleDateFormat sdf3 = new SimpleDateFormat("yyyy-MM-dd");
                    sdf3.setLenient(false);
                    return new Timestamp(sdf3.parse(dateStr).getTime());
                }
            }
        } catch (Exception e) {
            return null;
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        Map<String, Object> result = new HashMap<>();

        try {
            Integer userId = getCurrentUserId(request);

            // 获取上传的文件
            Part filePart = request.getPart("file");
            if (filePart == null) {
                result.put("success", false);
                result.put("message", "请选择CSV文件");
                response.getWriter().write(objectMapper.writeValueAsString(result));
                return;
            }

            // 检查文件类型
            String fileName = filePart.getSubmittedFileName();
            if (fileName == null || !fileName.toLowerCase().endsWith(".csv")) {
                result.put("success", false);
                result.put("message", "请上传CSV格式的文件");
                response.getWriter().write(objectMapper.writeValueAsString(result));
                return;
            }

            // 解析CSV文件
            List<Todo> todoList = new ArrayList<>();
            try (CSVReader csvReader = new CSVReader(new InputStreamReader(filePart.getInputStream(), "UTF-8"))) {
                String[] values;
                int lineNumber = 0;
                boolean isFirstLine = true;

                while ((values = csvReader.readNext()) != null) {
                    lineNumber++;

                    // 跳过标题行
                    if (isFirstLine) {
                        isFirstLine = false;
                        continue;
                    }

                    // 检查列数 (至少需要标题列)
                    if (values.length < 1) {
                        continue; // 跳过空行
                    }

                    try {
                        String title = values[0].trim();
                        String content = values.length > 1 ? values[1].trim() : "";
                        String statusStr = values.length > 2 ? values[2].trim() : "PENDING";
                        String startTimeStr = values.length > 3 ? values[3].trim() : "";
                        String dueDateStr = values.length > 4 ? values[4].trim() : "";

                        // 兼容旧格式（只有4列，无开始时间）
                        if (values.length <= 4 && !startTimeStr.isEmpty()) {
                            dueDateStr = startTimeStr;
                            startTimeStr = "";
                        }

                        if (title.isEmpty()) {
                            continue;
                        }

                        Todo todo = new Todo();
                        todo.setTitle(title);
                        todo.setContent(content.isEmpty() ? null : content);

                        if ("COMPLETED".equals(statusStr) || "INCOMPLETE".equals(statusStr)) {
                            todo.setStatus(statusStr);
                        } else {
                            todo.setStatus("PENDING");
                        }

                        todo.setStartTime(parseTimestamp(startTimeStr));
                        todo.setDueDate(parseTimestamp(dueDateStr));

                        todoList.add(todo);
                    } catch (Exception e) {
                        continue;
                    }
                }
            } catch (CsvValidationException e) {
                result.put("success", false);
                result.put("message", "CSV文件格式不正确");
                response.getWriter().write(objectMapper.writeValueAsString(result));
                return;
            }

            if (todoList.isEmpty()) {
                result.put("success", false);
                result.put("message", "CSV文件中没有有效的TODO数据");
                response.getWriter().write(objectMapper.writeValueAsString(result));
                return;
            }

            // 批量导入
            int count = todoService.batchImport(userId, todoList);

            result.put("success", true);
            result.put("message", "成功导入 " + count + " 条TODO记录");
            result.put("data", count);

        } catch (Exception e) {
            result.put("success", false);
            result.put("message", e.getMessage());
        }

        response.getWriter().write(objectMapper.writeValueAsString(result));
    }
}
