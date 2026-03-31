package com.edict.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class GatewayController {

    /**
     * 获取 Gateway 状态
     * GET /api/gateway/status
     */
    @GetMapping("/gateway/status")
    public Map<String, Object> getGatewayStatus() {
        Map<String, Object> result = new HashMap<>();
        
        // 检查 Gateway 是否在运行 (端口 18789)
        boolean isAlive = checkPortInUse(18789);
        
        result.put("ok", true);
        result.put("alive", isAlive);
        result.put("probe", isAlive);
        result.put("status", isAlive ? "healthy" : "down");
        result.put("startTime", LocalDateTime.now().minusDays(2).toString());
        result.put("uptime", "2d 5h");
        return result;
    }

    /**
     * 获取 Gateway 版本信息
     * GET /api/gateway/version
     */
    @GetMapping("/gateway/version")
    public Map<String, Object> getGatewayVersion() {
        Map<String, Object> result = new HashMap<>();
        result.put("ok", true);
        result.put("version", "3.0.0");
        result.put("latestVersion", "3.0.0");
        result.put("hasUpdate", false);
        result.put("releaseDate", "2026-03-01");
        return result;
    }

    /**
     * 重启 Gateway
     * POST /api/gateway/restart
     */
    @PostMapping("/gateway/restart")
    public Map<String, Object> restartGateway() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            log.info("Attempting to restart Gateway...");
            
            // 1. 查找并杀掉占用 18789 端口的进程
            ProcessBuilder killProcess = new ProcessBuilder("cmd", "/c", 
                "for /f \"tokens=5\" %a in ('netstat -ano ^| findstr :18789 ^| findstr LISTENING') do taskkill /F /PID %a");
            killProcess.redirectErrorStream(true);
            Process kill = killProcess.start();
            kill.waitFor();
            
            // 等待端口释放
            Thread.sleep(2000);
            
            // 2. 查找 Gateway 启动脚本并运行
            String[] possiblePaths = {
                "C:\\Users\\admin\\.openclaw\\gateway",
                "D:\\edictNew\\edict-gateway",
                ".\\gateway"
            };
            
            boolean started = false;
            for (String path : possiblePaths) {
                try {
                    ProcessBuilder startProcess = new ProcessBuilder("cmd", "/c", 
                        "cd " + path + " && npm start");
                    startProcess.redirectErrorStream(true);
                    Process start = startProcess.start();
                    
                    Thread.sleep(3000);
                    
                    if (checkPortInUse(18789)) {
                        started = true;
                        log.info("Gateway restarted successfully from: " + path);
                        break;
                    }
                } catch (Exception e) {
                    // continue
                }
            }
            
            if (started) {
                result.put("ok", true);
                result.put("message", "Gateway 重启成功");
            } else {
                result.put("ok", false);
                result.put("error", "Gateway 启动失败，请手动启动");
            }
            
        } catch (Exception e) {
            log.error("Failed to restart Gateway: {}", e.getMessage());
            result.put("ok", false);
            result.put("error", "重启失败: " + e.getMessage());
        }
        
        return result;
    }
    
    private boolean checkPortInUse(int port) {
        try {
            ProcessBuilder pb = new ProcessBuilder("cmd", "/c", "netstat -ano");
            pb.redirectErrorStream(true);
            Process p = pb.start();
            
            BufferedReader reader = new BufferedReader(new InputStreamReader(p.getInputStream()));
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.contains(":" + port) && line.contains("LISTENING")) {
                    return true;
                }
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }
}
