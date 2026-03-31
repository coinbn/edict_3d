package com.edict.config;

import com.edict.service.TerminalSessionService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;

@Component
public class TerminalWebSocketHandler extends TextWebSocketHandler {

    private final TerminalSessionService terminalSessionService;

    @Value("${edict.terminal.working-dir:D:/edictNew/edict-web-3d}")
    private String workingDir;

    @Value("${edict.terminal.command:npm run dev}")
    private String command;

    public TerminalWebSocketHandler(TerminalSessionService terminalSessionService) {
        this.terminalSessionService = terminalSessionService;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String sessionId = session.getId();

        try {
            List<String> commandParts = Arrays.asList(command.trim().split("\\s+"));
            ProcessBuilder pb = new ProcessBuilder(commandParts);
            pb.directory(new java.io.File(workingDir));
            pb.redirectErrorStream(true);

            Process process = pb.start();
            terminalSessionService.registerSession(sessionId, session, process, command, workingDir);

            new Thread(() -> {
                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        if (session.isOpen()) {
                            session.sendMessage(new TextMessage(line + "\r\n"));
                        }
                    }
                } catch (Exception e) {
                    terminalSessionService.markError(sessionId, e.getMessage());
                }
            }).start();

            session.sendMessage(new TextMessage(
                    "\u001b[36m➜\u001b[0m Starting command: " + command + "\r\n" +
                    "\u001b[90mworking-dir: " + workingDir + "\u001b[0m\r\n\r\n"
            ));

        } catch (Exception e) {
            terminalSessionService.markError(sessionId, e.getMessage());
            try {
                session.sendMessage(new TextMessage("\u001b[31mError: \u001b[0m " + e.getMessage() + "\r\n"));
            } catch (Exception ex) {
                terminalSessionService.markError(sessionId, ex.getMessage());
            }
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        String cmd = message.getPayload();
        Process process = terminalSessionService.getProcess(session.getId());
        if (process != null && process.getOutputStream() != null) {
            try {
                process.getOutputStream().write((cmd + "\n").getBytes());
                process.getOutputStream().flush();
            } catch (Exception e) {
                terminalSessionService.markError(session.getId(), e.getMessage());
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        terminalSessionService.removeSession(session.getId());
    }
}
