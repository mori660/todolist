package com.todo.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

/**
 * MiMo-V2-Omni API 客户端（Anthropic 兼容格式）
 */
public class MimoApiClient {

    // 尝试 Anthropic 标准路径
    private static final String API_URL = "https://token-plan-cn.xiaomimimo.com/anthropic/v1/messages";
    private static final String API_KEY = "tp-chjp4mpdychsf2toxvfas94jkc70tzsrpql6ek6wzo5i71dw";
    private static final String MODEL = "mimo-v2-omni";

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public MimoApiClient() {
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * 发送聊天请求
     *
     * @param systemPrompt 系统提示词
     * @param userMessage  用户文字消息
     * @return AI 响应内容
     */
    public String chat(String systemPrompt, String userMessage) throws Exception {
        // 组装 messages（Anthropic 格式）
        List<Map<String, Object>> messages = new ArrayList<>();

        // user message
        List<Map<String, Object>> userContent = new ArrayList<>();
        userContent.add(Map.of("type", "text", "text", userMessage));

        messages.add(Map.of("role", "user", "content", userContent));

        // 构建请求体（Anthropic Messages API 格式）
        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("model", MODEL);
        requestBody.put("max_tokens", 4096);
        requestBody.put("system", systemPrompt);
        requestBody.put("messages", messages);

        String jsonBody = objectMapper.writeValueAsString(requestBody);

        // 发送请求（Anthropic 认证格式）
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(API_URL))
            .header("x-api-key", API_KEY)
            .header("anthropic-version", "2023-06-01")
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
            .timeout(Duration.ofSeconds(30))
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        // 检查响应状态
        if (response.statusCode() != 200) {
            throw new Exception("API 请求失败，状态码: " + response.statusCode() + ", 响应: " + response.body());
        }

        // 解析响应
        return extractContent(response.body());
    }

    /**
     * 从 API 响应中提取 content（Anthropic 格式）
     */
    private String extractContent(String responseBody) throws Exception {
        JsonNode root = objectMapper.readTree(responseBody);

        // 检查是否有错误
        if (root.has("error")) {
            String errorMsg = root.get("error").has("message")
                ? root.get("error").get("message").asText()
                : "未知错误";
            throw new Exception("API 错误: " + errorMsg);
        }

        // Anthropic 格式：content 是一个数组
        JsonNode contentArray = root.get("content");
        if (contentArray == null || !contentArray.isArray() || contentArray.isEmpty()) {
            throw new Exception("API 响应中没有 content");
        }

        // 提取第一个 text 类型的 content
        StringBuilder result = new StringBuilder();
        for (JsonNode contentBlock : contentArray) {
            if (contentBlock.has("type") && "text".equals(contentBlock.get("type").asText())) {
                result.append(contentBlock.get("text").asText(""));
            }
        }

        if (result.length() == 0) {
            throw new Exception("API 响应内容为空");
        }

        return result.toString();
    }
}
