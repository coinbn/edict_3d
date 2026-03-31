package com.edict.util;

import lombok.extern.slf4j.Slf4j;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.concurrent.TimeUnit;

/**
 * OpenClaw CLI 工具类
 * 用于调用 openclaw agent 命令执行 agent 任务
 */
@Slf4j
public class OpenClawCli {

    // Windows 上使用完整路径
    private static final String COMMAND = "C:\\Users\\admin\\AppData\\Roaming\\npm\\openclaw.cmd";
    private static final int DEFAULT_TIMEOUT = 300; // 5分钟

    /**
     * 执行 OpenClaw agent 命令
     *
     * @param agentId Agent ID (如 zaochao, zhongshu 等)
     * @param message 要发送的消息/任务
     * @return 命令执行结果
     */
    public static CliResult execute(String agentId, String message) {
        return execute(agentId, message, DEFAULT_TIMEOUT);
    }

    /**
     * 执行 OpenClaw agent 命令（自定义超时）
     *
     * @param agentId  Agent ID
     * @param message 要发送的消息/任务
     * @param timeout  超时时间（秒）
     * @return 命令执行结果
     */
    public static CliResult execute(String agentId, String message, int timeout) {
        return execute(agentId, message, timeout, null);
    }

    /**
     * 执行 OpenClaw agent 命令（带额外参数）
     *
     * @param agentId    Agent ID
     * @param message    要发送的消息/任务
     * @param timeout    超时时间（秒）
     * @param extraArgs  额外参数（如 --model 等）
     * @return 命令执行结果
     */
    public static CliResult execute(String agentId, String message, int timeout, String[] extraArgs) {
        try {
            ProcessBuilder pb = new ProcessBuilder();
            
            // 构建命令: openclaw agent --agent <agentId> --timeout <seconds> -m "<message>"
            // 注意：timeout 必须在 -m 之前，否则会被当成消息内容
            pb.command(COMMAND, "agent", "--agent", agentId, "--timeout", String.valueOf(timeout), "-m", message);
            
            // 添加额外参数
            if (extraArgs != null) {
                for (String arg : extraArgs) {
                    pb.command().add(arg);
                }
            }
            
            pb.redirectErrorStream(true);
            pb.redirectInput(ProcessBuilder.Redirect.PIPE);
            
            log.debug("执行命令: {} {}", String.join(" ", pb.command()), message);
            
            Process process = pb.start();
            
            // 读取输出 - 使用 UTF-8 编码
            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), "UTF-8"))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }
            }
            
            // 等待进程结束
            boolean finished = process.waitFor(timeout, TimeUnit.SECONDS);
            
            int exitCode;
            if (finished) {
                exitCode = process.exitValue();
            } else {
                process.destroyForcibly();
                exitCode = -1;
                output.append("TIMEOUT: 命令执行超过 ").append(timeout).append(" 秒");
            }
            
            return new CliResult(exitCode, output.toString(), null);
            
        } catch (Exception e) {
            log.error("执行 OpenClaw CLI 失败: agent={}, error={}", agentId, e.getMessage());
            return new CliResult(-1, null, e.getMessage());
        }
    }

    /**
     * 获取所有会话列表（JSON格式）
     * @return 命令执行结果
     */
    public static CliResult getSessionsList() {
        try {
            ProcessBuilder pb = new ProcessBuilder();
            pb.command(COMMAND, "sessions", "list", "--json");
            pb.redirectErrorStream(true);
            
            Process process = pb.start();
            
            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), "UTF-8"))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }
            }
            
            boolean finished = process.waitFor(30, TimeUnit.SECONDS);
            int exitCode;
            if (finished) {
                exitCode = process.exitValue();
            } else {
                process.destroyForcibly();
                exitCode = -1;
                output.append("TIMEOUT: 命令执行超过 30 秒");
            }
            
            return new CliResult(exitCode, output.toString(), null);
            
        } catch (Exception e) {
            log.error("获取会话列表失败: {}", e.getMessage());
            return new CliResult(-1, null, e.getMessage());
        }
    }

    /**
     * CLI 执行结果
     */
    public static class CliResult {
        private final int exitCode;
        private final String output;
        private final String error;

        public CliResult(int exitCode, String output, String error) {
            this.exitCode = exitCode;
            this.output = output;
            this.error = error;
        }

        public int getExitCode() {
            return exitCode;
        }

        public String getOutput() {
            return output;
        }

        public String getError() {
            return error;
        }

        public boolean isSuccess() {
            return exitCode == 0 && error == null;
        }

        @Override
        public String toString() {
            return "CliResult{" +
                    "exitCode=" + exitCode +
                    ", output='" + (output != null ? output.substring(0, Math.min(200, output.length())) + "..." : "null") + 
                    ", error='" + error + '\'' +
                    '}';
        }
    }
}
