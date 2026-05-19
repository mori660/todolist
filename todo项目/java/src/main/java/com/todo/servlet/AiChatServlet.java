package com.todo.servlet;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.todo.service.AiChatService;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

/**
 * AI 聊天 Servlet - 处理前端 AI 对话请求
 */
@WebServlet("/api/ai/chat")
public class AiChatServlet extends HttpServlet {

    private final AiChatService aiChatService = new AiChatService();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        // 设置响应类型
        resp.setContentType("application/json;charset=UTF-8");

        // 检查登录状态
        Integer userId = (Integer) req.getSession().getAttribute("userId");
        if (userId == null) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            resp.getWriter().write("{\"success\":false,\"message\":\"请先登录\"}");
            return;
        }

        try {
            // 解析请求体
            JsonNode body = objectMapper.readTree(req.getInputStream());

            String message = "";
            if (body.has("message")) {
                message = body.get("message").asText("");
            }

            // 验证输入
            if (message == null || message.isEmpty()) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                resp.getWriter().write("{\"success\":false,\"message\":\"请提供消息内容\"}");
                return;
            }

            // 调用 AI 服务
            String result = aiChatService.chat(userId, message);

            // 返回结果
            resp.getWriter().write(result);

        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"success\":false,\"message\":\"服务器错误: " + e.getMessage().replace("\"", "'") + "\"}");
        }
    }
}
