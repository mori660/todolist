package com.todo.servlet;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.todo.model.User;
import com.todo.service.UserService;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.BufferedReader;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@WebServlet("/api/user/*")
public class UserServlet extends HttpServlet {
    private UserService userService = new UserService();
    private ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String pathInfo = request.getPathInfo();
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        Map<String, Object> result = new HashMap<>();

        try {
            if ("/register".equals(pathInfo)) {
                // 用户注册
                BufferedReader reader = request.getReader();
                Map<String, String> params = objectMapper.readValue(reader, Map.class);
                String username = params.get("username");
                String password = params.get("password");

                if (username == null || username.trim().isEmpty() || password == null || password.trim().isEmpty()) {
                    result.put("success", false);
                    result.put("message", "用户名和密码不能为空");
                } else {
                    User user = userService.register(username, password);
                    result.put("success", true);
                    result.put("message", "注册成功");
                    result.put("data", user.getId());
                }
            } else if ("/login".equals(pathInfo)) {
                // 用户登录
                BufferedReader reader = request.getReader();
                Map<String, String> params = objectMapper.readValue(reader, Map.class);
                String username = params.get("username");
                String password = params.get("password");

                if (username == null || username.trim().isEmpty() || password == null || password.trim().isEmpty()) {
                    result.put("success", false);
                    result.put("message", "用户名和密码不能为空");
                } else {
                    User user = userService.login(username, password);
                    // 设置session
                    HttpSession session = request.getSession();
                    session.setAttribute("userId", user.getId());
                    session.setAttribute("username", user.getUsername());

                    result.put("success", true);
                    result.put("message", "登录成功");
                    result.put("data", user.getId());
                }
            } else if ("/logout".equals(pathInfo)) {
                // 用户登出
                HttpSession session = request.getSession(false);
                if (session != null) {
                    session.invalidate();
                }
                result.put("success", true);
                result.put("message", "登出成功");
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
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String pathInfo = request.getPathInfo();
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        Map<String, Object> result = new HashMap<>();

        try {
            if ("/check".equals(pathInfo)) {
                // 检查登录状态
                HttpSession session = request.getSession(false);
                if (session != null && session.getAttribute("userId") != null) {
                    result.put("success", true);
                    result.put("loggedIn", true);
                    result.put("userId", session.getAttribute("userId"));
                    result.put("username", session.getAttribute("username"));
                } else {
                    result.put("success", true);
                    result.put("loggedIn", false);
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
}