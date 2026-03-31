package com.edict.service;

import com.edict.config.EdictProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class FFmpegService {
    
    private final EdictProperties properties;
    
    /**
     * 提取视频信息
     */
    public VideoInfo getVideoInfo(String videoPath) {
        try {
            ProcessBuilder pb = new ProcessBuilder(
                    properties.getFfmpeg().getFfprobePath(),
                    "-v", "error",
                    "-select_streams", "v:0",
                    "-show_entries", "stream=width,height,duration",
                    "-of", "csv=s=x:p=0",
                    videoPath
            );
            
            Process process = pb.start();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String output = reader.readLine();
                if (output != null) {
                    String[] parts = output.split("x");
                    if (parts.length == 3) {
                        return VideoInfo.builder()
                                .width(Integer.parseInt(parts[0].trim()))
                                .height(Integer.parseInt(parts[1].trim()))
                                .duration(Double.parseDouble(parts[2].trim()))
                                .build();
                    }
                }
            }
            process.waitFor();
        } catch (Exception e) {
            log.error("获取视频信息失败: {}", videoPath, e);
        }
        return null;
    }
    
    /**
     * 提取音频（用于波形显示）
     */
    public String extractAudio(String videoPath) {
        try {
            String audioPath = properties.getUpload().getAudioPath() + "/" + UUID.randomUUID() + ".wav";
            Path path = Paths.get(audioPath);
            Files.createDirectories(path.getParent());
            
            ProcessBuilder pb = new ProcessBuilder(
                    properties.getFfmpeg().getFfmpegPath(),
                    "-i", videoPath,
                    "-vn",                           // 无视频
                    "-acodec", "pcm_s16le",         // PCM 16位
                    "-ar", "44100",                 // 采样率 44.1kHz
                    "-ac", "1",                      // 单声道
                    audioPath
            );
            
            Process process = pb.inheritIO().start();
            int exitCode = process.waitFor();
            
            if (exitCode == 0) {
                return audioPath;
            }
        } catch (Exception e) {
            log.error("提取音频失败: {}", videoPath, e);
        }
        return null;
    }
    
    /**
     * 生成缩略图
     */
    public String generateThumbnail(String videoPath, double seconds) {
        try {
            String thumbPath = properties.getUpload().getPath() + "/thumbs/" + UUID.randomUUID() + ".jpg";
            Path path = Paths.get(thumbPath);
            Files.createDirectories(path.getParent());
            
            ProcessBuilder pb = new ProcessBuilder(
                    properties.getFfmpeg().getFfmpegPath(),
                    "-ss", String.valueOf(seconds),
                    "-i", videoPath,
                    "-vframes", "1",
                    "-q:v", "2",
                    thumbPath
            );
            
            Process process = pb.inheritIO().start();
            int exitCode = process.waitFor();
            
            if (exitCode == 0) {
                return thumbPath;
            }
        } catch (Exception e) {
            log.error("生成缩略图失败: {}", videoPath, e);
        }
        return null;
    }
    
    /**
     * 视频信息
     */
    @lombok.Data
    @lombok.Builder
    public static class VideoInfo {
        private Integer width;
        private Integer height;
        private Double duration;
    }
}
