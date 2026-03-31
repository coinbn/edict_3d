package com.edict.service;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private static final DateTimeFormatter ISO_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");

    private final List<Map<String, Object>> chatMessages = new CopyOnWriteArrayList<>();
    private final Map<String, List<Map<String, Object>>> agentChats = new HashMap<>();

    public Map<String, Object> sendMessage(String agentId, String content, String channelId) {
        Map<String, Object> response = new HashMap<>();
        if (agentId == null || content == null || content.trim().isEmpty()) {
            response.put("ok", false);
            response.put("error", "agentId and content are required");
            return response;
        }

        String safeChannel = (channelId == null || channelId.trim().isEmpty()) ? "default" : channelId;
        Map<String, Object> message = new HashMap<>();
        message.put("id", UUID.randomUUID().toString().substring(0, 8));
        message.put("agentId", agentId);
        message.put("content", content);
        message.put("channelId", safeChannel);
        message.put("timestamp", LocalDateTime.now().format(ISO_FORMATTER));

        chatMessages.add(message);
        synchronized (agentChats) {
            agentChats.computeIfAbsent(agentId, k -> new ArrayList<>()).add(message);
        }

        response.put("ok", true);
        response.put("message", message);
        return response;
    }

    public Map<String, Object> getMessages(String channelId, Integer page, Integer size) {
        int safePage = page == null || page < 0 ? 0 : page;
        int safeSize = size == null || size <= 0 ? 50 : Math.min(size, 200);

        List<Map<String, Object>> filtered = chatMessages.stream()
                .filter(msg -> channelId == null || channelId.isEmpty() || channelId.equals(msg.get("channelId")))
                .collect(Collectors.toList());

        int total = filtered.size();
        int fromIndex = Math.min(safePage * safeSize, total);
        int toIndex = Math.min(fromIndex + safeSize, total);
        List<Map<String, Object>> paged = filtered.subList(fromIndex, toIndex);

        Map<String, Object> response = new HashMap<>();
        response.put("ok", true);
        response.put("messages", paged);
        response.put("total", total);
        response.put("page", safePage);
        response.put("size", safeSize);
        return response;
    }

    public Map<String, Object> getAgentMessages(String agentId) {
        List<Map<String, Object>> messages;
        synchronized (agentChats) {
            messages = new ArrayList<>(agentChats.getOrDefault(agentId, Collections.emptyList()));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("ok", true);
        response.put("messages", messages);
        response.put("total", messages.size());
        return response;
    }

    public Map<String, Object> getChannels() {
        Map<String, Integer> channelCounts = new HashMap<>();
        for (Map<String, Object> msg : chatMessages) {
            String channel = String.valueOf(msg.getOrDefault("channelId", "default"));
            channelCounts.put(channel, channelCounts.getOrDefault(channel, 0) + 1);
        }

        List<Map<String, Object>> channels = channelCounts.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("channelId", entry.getKey());
                    item.put("count", entry.getValue());
                    return item;
                })
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("ok", true);
        response.put("channels", channels);
        response.put("total", channels.size());
        return response;
    }

    public Map<String, Object> clearMessages(String channelId) {
        if (channelId == null || channelId.isEmpty()) {
            chatMessages.clear();
            synchronized (agentChats) {
                agentChats.clear();
            }
            return okMessage("Chat history cleared");
        }

        chatMessages.removeIf(msg -> channelId.equals(msg.get("channelId")));
        synchronized (agentChats) {
            agentChats.replaceAll((agent, msgs) -> msgs.stream()
                    .filter(msg -> !channelId.equals(msg.get("channelId")))
                    .collect(Collectors.toList()));
            agentChats.entrySet().removeIf(entry -> entry.getValue().isEmpty());
        }
        return okMessage("Channel messages cleared: " + channelId);
    }

    public Map<String, Object> clearChannel(String channelId) {
        if (channelId == null || channelId.isEmpty()) {
            Map<String, Object> response = new HashMap<>();
            response.put("ok", false);
            response.put("error", "channelId is required");
            return response;
        }
        return clearMessages(channelId);
    }

    private Map<String, Object> okMessage(String text) {
        Map<String, Object> response = new HashMap<>();
        response.put("ok", true);
        response.put("message", text);
        return response;
    }
}
