package com.edict.service;

import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TerminalSessionService {

    private static final DateTimeFormatter ISO_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");

    private final Map<String, TerminalSessionRecord> sessions = new ConcurrentHashMap<>();

    public void registerSession(String sessionId, WebSocketSession webSocketSession, Process process, String command, String workingDir) {
        TerminalSessionRecord record = new TerminalSessionRecord();
        record.sessionId = sessionId;
        record.webSocketSession = webSocketSession;
        record.process = process;
        record.command = command;
        record.workingDir = workingDir;
        record.status = "running";
        record.startedAt = LocalDateTime.now();
        sessions.put(sessionId, record);
    }

    public void markError(String sessionId, String error) {
        TerminalSessionRecord record = sessions.get(sessionId);
        if (record != null) {
            record.status = "error";
            record.error = error;
            record.updatedAt = LocalDateTime.now();
        }
    }

    public void removeSession(String sessionId) {
        TerminalSessionRecord removed = sessions.remove(sessionId);
        if (removed != null) {
            destroyProcess(removed.process);
        }
    }

    public List<Map<String, Object>> listSessions() {
        List<Map<String, Object>> items = new ArrayList<>();
        for (TerminalSessionRecord record : sessions.values()) {
            items.add(toDto(record));
        }
        items.sort(Comparator.comparing(m -> String.valueOf(m.get("startedAt"))));
        return items;
    }

    public Map<String, Object> getSession(String sessionId) {
        TerminalSessionRecord record = sessions.get(sessionId);
        if (record == null) {
            return null;
        }
        return toDto(record);
    }

    public boolean closeSession(String sessionId) {
        TerminalSessionRecord record = sessions.get(sessionId);
        if (record == null) {
            return false;
        }
        try {
            if (record.webSocketSession != null && record.webSocketSession.isOpen()) {
                record.webSocketSession.close();
            }
        } catch (Exception ignored) {
        }
        destroyProcess(record.process);
        sessions.remove(sessionId);
        return true;
    }

    public Process getProcess(String sessionId) {
        TerminalSessionRecord record = sessions.get(sessionId);
        return record != null ? record.process : null;
    }

    private Map<String, Object> toDto(TerminalSessionRecord record) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("sessionId", record.sessionId);
        dto.put("status", resolveStatus(record));
        dto.put("command", record.command);
        dto.put("workingDir", record.workingDir);
        dto.put("startedAt", record.startedAt != null ? record.startedAt.format(ISO_FORMATTER) : null);
        dto.put("updatedAt", record.updatedAt != null ? record.updatedAt.format(ISO_FORMATTER) : null);
        dto.put("error", record.error);
        dto.put("alive", record.process != null && record.process.isAlive());
        return dto;
    }

    private String resolveStatus(TerminalSessionRecord record) {
        if (record.process == null) {
            return record.status;
        }
        if (record.process.isAlive() && !"error".equals(record.status)) {
            return "running";
        }
        if ("error".equals(record.status)) {
            return "error";
        }
        return "stopped";
    }

    private void destroyProcess(Process process) {
        if (process != null && process.isAlive()) {
            process.destroy();
        }
    }

    private static class TerminalSessionRecord {
        String sessionId;
        String status;
        String command;
        String workingDir;
        String error;
        LocalDateTime startedAt;
        LocalDateTime updatedAt;
        Process process;
        WebSocketSession webSocketSession;
    }
}
