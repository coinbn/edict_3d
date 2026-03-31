package com.edict.controller;

import com.edict.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 协作聊天控制器 - 处理 Agent 间的消息通信
 */
@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@RequestMapping("/chat")
public class ChatController {
    private final ChatService chatService;
    
    /**
     * 发送聊天消息
     * POST /api/chat/message
     */
    @PostMapping("/message")
    public Map<String, Object> sendMessage(@RequestBody Map<String, Object> body) {
        String agentId = (String) body.get("agentId");
        String content = (String) body.get("content");
        String channelId = (String) body.getOrDefault("channelId", "default");
        return chatService.sendMessage(agentId, content, channelId);
    }
    
    /**
     * 获取聊天消息历史
     * GET /api/chat/messages?channelId=xxx
     */
    @GetMapping("/messages")
    public Map<String, Object> getMessages(
            @RequestParam(required = false) String channelId,
            @RequestParam(required = false, defaultValue = "0") Integer page,
            @RequestParam(required = false, defaultValue = "50") Integer size) {
        return chatService.getMessages(channelId, page, size);
    }
    
    /**
     * 获取特定 Agent 的消息历史
     * GET /api/chat/agent/{agentId}/messages
     */
    @GetMapping("/agent/{agentId}/messages")
    public Map<String, Object> getAgentMessages(@PathVariable String agentId) {
        return chatService.getAgentMessages(agentId);
    }

    /**
     * 获取频道列表
     * GET /api/chat/channels
     */
    @GetMapping("/channels")
    public Map<String, Object> getChannels() {
        return chatService.getChannels();
    }

    /**
     * 删除频道消息
     * DELETE /api/chat/channel/{channelId}
     */
    @DeleteMapping("/channel/{channelId}")
    public Map<String, Object> clearChannel(@PathVariable String channelId) {
        return chatService.clearChannel(channelId);
    }
    
    /**
     * 清除聊天历史
     * POST /api/chat/clear
     */
    @PostMapping("/clear")
    public Map<String, Object> clearMessages(@RequestBody Map<String, Object> body) {
        String channelId = (String) body.get("channelId");
        return chatService.clearMessages(channelId);
    }
}
