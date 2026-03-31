package com.edict.controller;

import com.edict.service.TerminalSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@RequestMapping("/terminal/sessions")
public class TerminalController {

    private final TerminalSessionService terminalSessionService;

    @GetMapping
    public Map<String, Object> listSessions() {
        List<Map<String, Object>> sessions = terminalSessionService.listSessions();
        Map<String, Object> response = new HashMap<>();
        response.put("ok", true);
        response.put("sessions", sessions);
        response.put("total", sessions.size());
        return response;
    }

    @GetMapping("/{sessionId}")
    public Map<String, Object> getSession(@PathVariable String sessionId) {
        Map<String, Object> session = terminalSessionService.getSession(sessionId);
        Map<String, Object> response = new HashMap<>();
        if (session == null) {
            response.put("ok", false);
            response.put("error", "Session not found: " + sessionId);
            return response;
        }
        response.put("ok", true);
        response.put("session", session);
        return response;
    }

    @DeleteMapping("/{sessionId}")
    public Map<String, Object> closeSession(@PathVariable String sessionId) {
        boolean closed = terminalSessionService.closeSession(sessionId);
        Map<String, Object> response = new HashMap<>();
        response.put("ok", closed);
        if (closed) {
            response.put("message", "Session closed: " + sessionId);
        } else {
            response.put("error", "Session not found: " + sessionId);
        }
        return response;
    }
}
