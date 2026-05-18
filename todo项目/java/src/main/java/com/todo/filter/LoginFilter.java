package com.todo.filter;

import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

@WebFilter("/*")
public class LoginFilter implements Filter {

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        // 初始化过滤器
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        String requestURI = httpRequest.getRequestURI();
        String contextPath = httpRequest.getContextPath();

        // 允许访问的路径（不需要登录）
        if (isAllowedPath(requestURI, contextPath)) {
            chain.doFilter(request, response);
            return;
        }

        // 检查是否已登录
        HttpSession session = httpRequest.getSession(false);
        if (session != null && session.getAttribute("userId") != null) {
            // 已登录，继续请求
            chain.doFilter(request, response);
        } else {
            // 未登录
            // 如果是API请求，返回JSON格式的错误信息
            if (requestURI.startsWith(contextPath + "/api/")) {
                httpResponse.setContentType("application/json");
                httpResponse.setCharacterEncoding("UTF-8");
                httpResponse.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                httpResponse.getWriter().write("{\"success\":false,\"message\":\"未登录，请先登录\"}");
            } else {
                // 如果是页面请求，重定向到登录页面
                httpResponse.sendRedirect(contextPath + "/login.jsp");
            }
        }
    }

    @Override
    public void destroy() {
        // 销毁
    }

    /**
     * 判断是否是允许访问的路径（不需要登录）
     */
    private boolean isAllowedPath(String requestURI, String contextPath) {
        // 允许访问登录页面
        if (requestURI.equals(contextPath + "/login.jsp")) {
            return true;
        }
        // 允许访问注册页面
        if (requestURI.equals(contextPath + "/register.jsp")) {
            return true;
        }
        // 允许访问用户登录、注册、登出接口
        if (requestURI.startsWith(contextPath + "/api/user/")) {
            String path = requestURI.substring((contextPath + "/api/user/").length());
            if ("login".equals(path) || "register".equals(path) || "logout".equals(path) || "check".equals(path)) {
                return true;
            }
        }
        // 允许访问静态资源
        if (requestURI.startsWith(contextPath + "/css/") ||
            requestURI.startsWith(contextPath + "/js/") ||
            requestURI.startsWith(contextPath + "/images/") ||
            requestURI.startsWith(contextPath + "/lib/")) {
            return true;
        }
        return false;
    }
}