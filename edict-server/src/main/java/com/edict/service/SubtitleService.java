package com.edict.service;

import com.edict.dto.SubtitleDTO;
import com.edict.entity.Project;
import com.edict.entity.Subtitle;
import com.edict.repository.ProjectRepository;
import com.edict.repository.SubtitleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FilenameUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubtitleService {
    
    private final SubtitleRepository subtitleRepository;
    private final ProjectRepository projectRepository;
    
    @Transactional(readOnly = true)
    public List<SubtitleDTO> getSubtitlesByProjectId(Long projectId) {
        return subtitleRepository.findByProjectIdOrderByStartTimeAsc(projectId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public SubtitleDTO createSubtitle(Long projectId, SubtitleDTO dto) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("项目不存在"));
        
        Subtitle subtitle = new Subtitle();
        subtitle.setProject(project);
        subtitle.setStartTime(dto.getStartTime());
        subtitle.setEndTime(dto.getEndTime());
        subtitle.setStartTimeMs(timeToMs(dto.getStartTime()));
        subtitle.setEndTimeMs(timeToMs(dto.getEndTime()));
        subtitle.setText(dto.getText());
        subtitle.setSpeaker(dto.getSpeaker());
        subtitle.setNote(dto.getNote());
        
        Subtitle saved = subtitleRepository.save(subtitle);
        return convertToDTO(saved);
    }
    
    @Transactional
    public SubtitleDTO updateSubtitle(Long id, SubtitleDTO dto) {
        Subtitle subtitle = subtitleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("字幕不存在"));
        
        subtitle.setStartTime(dto.getStartTime());
        subtitle.setEndTime(dto.getEndTime());
        subtitle.setStartTimeMs(timeToMs(dto.getStartTime()));
        subtitle.setEndTimeMs(timeToMs(dto.getEndTime()));
        subtitle.setText(dto.getText());
        subtitle.setSpeaker(dto.getSpeaker());
        subtitle.setNote(dto.getNote());
        
        Subtitle saved = subtitleRepository.save(subtitle);
        return convertToDTO(saved);
    }
    
    @Transactional
    public void deleteSubtitle(Long id) {
        subtitleRepository.deleteById(id);
    }
    
    @Transactional
    public List<SubtitleDTO> importSubtitles(Long projectId, MultipartFile file) throws IOException {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("项目不存在"));
        
        String ext = FilenameUtils.getExtension(file.getOriginalFilename()).toLowerCase();
        String content = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))
                .lines().collect(Collectors.joining("\n"));
        
        List<Subtitle> subtitles = new ArrayList<>();
        
        switch (ext) {
            case "srt":
                subtitles = parseSrt(content, project);
                break;
            case "ass":
            case "ssa":
                subtitles = parseAss(content, project);
                break;
            case "vtt":
                subtitles = parseVtt(content, project);
                break;
            default:
                throw new RuntimeException("不支持的文件格式: " + ext);
        }
        
        // 删除旧字幕
        subtitleRepository.deleteByProjectId(projectId);
        
        // 保存新字幕
        List<Subtitle> saved = subtitleRepository.saveAll(subtitles);
        
        return saved.stream().map(this::convertToDTO).collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public String exportSubtitles(Long projectId, String format) {
        List<Subtitle> subtitles = subtitleRepository.findByProjectIdOrderByStartTimeAsc(projectId);
        
        switch (format.toLowerCase()) {
            case "srt":
                return exportToSrt(subtitles);
            case "ass":
                return exportToAss(subtitles);
            case "vtt":
                return exportToVtt(subtitles);
            default:
                throw new RuntimeException("不支持的导出格式: " + format);
        }
    }
    
    private List<Subtitle> parseSrt(String content, Project project) {
        List<Subtitle> list = new ArrayList<>();
        
        // SRT 格式: 序号\n时间码 --> 时间码\n文本\n\n
        Pattern pattern = Pattern.compile(
                "(\\d+)\\s*\\n" +
                "(\\d{2}:\\d{2}:\\d{2},\\d{3})\\s*-->\\s*(\\d{2}:\\d{2}:\\d{2},\\d{3})\\s*\\n" +
                "((?:(?!\\n\\n|\\n\\d+\\n).)*)", 
                Pattern.DOTALL
        );
        
        Matcher matcher = pattern.matcher(content);
        int index = 1;
        while (matcher.find()) {
            Subtitle s = new Subtitle();
            s.setProject(project);
            s.setSubIndex(index++);
            s.setStartTime(parseSrtTime(matcher.group(2)));
            s.setEndTime(parseSrtTime(matcher.group(3)));
            s.setStartTimeMs(srtTimeToMs(matcher.group(2)));
            s.setEndTimeMs(srtTimeToMs(matcher.group(3)));
            s.setText(matcher.group(4).trim());
            list.add(s);
        }
        
        return list;
    }
    
    private List<Subtitle> parseAss(String content, Project project) {
        List<Subtitle> list = new ArrayList<>();
        
        // 找到 [Events] 部分
        int eventsStart = content.indexOf("[Events]");
        if (eventsStart == -1) return list;
        
        String eventsSection = content.substring(eventsStart);
        String[] lines = eventsSection.split("\\n");
        
        int index = 1;
        for (String line : lines) {
            if (line.startsWith("Dialogue:")) {
                Subtitle s = parseAssDialogue(line, project, index++);
                if (s != null) list.add(s);
            }
        }
        
        return list;
    }
    
    private Subtitle parseAssDialogue(String line, Project project, int index) {
        try {
            // Dialogue: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
            String[] parts = line.substring(9).split(",", 10);
            if (parts.length < 10) return null;
            
            Subtitle s = new Subtitle();
            s.setProject(project);
            s.setSubIndex(index);
            s.setStartTime(parseAssTime(parts[1].trim()));
            s.setEndTime(parseAssTime(parts[2].trim()));
            s.setStartTimeMs(assTimeToMs(parts[1].trim()));
            s.setEndTimeMs(assTimeToMs(parts[2].trim()));
            s.setSpeaker(parts[4].trim());
            s.setText(parts[9].trim().replaceAll("\\{[^}]*\\}", "")); // 移除 ASS 标签
            
            return s;
        } catch (Exception e) {
            log.warn("解析 ASS 行失败: {}", line);
            return null;
        }
    }
    
    private List<Subtitle> parseVtt(String content, Project project) {
        List<Subtitle> list = new ArrayList<>();
        
        // 跳过 WEBVTT 头部
        int start = content.indexOf("\n\n");
        if (start == -1) start = content.indexOf("\n");
        String body = start > 0 ? content.substring(start) : content;
        
        Pattern pattern = Pattern.compile(
                "\\n?(\\d+)?\\n?" +
                "(\\d{2}:\\d{2}:\\d{2}\\.\\d{3})\\s*-->\\s*(\\d{2}:\\d{2}:\\d{2}\\.\\d{3})\\n" +
                "((?:(?!\\n\\n).)*)",
                Pattern.DOTALL
        );
        
        Matcher matcher = pattern.matcher(body);
        int index = 1;
        while (matcher.find()) {
            Subtitle s = new Subtitle();
            s.setProject(project);
            s.setSubIndex(index++);
            s.setStartTime(parseVttTime(matcher.group(2)));
            s.setEndTime(parseVttTime(matcher.group(3)));
            s.setStartTimeMs(vttTimeToMs(matcher.group(2)));
            s.setEndTimeMs(vttTimeToMs(matcher.group(3)));
            s.setText(matcher.group(4).trim());
            list.add(s);
        }
        
        return list;
    }
    
    private String exportToSrt(List<Subtitle> subtitles) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < subtitles.size(); i++) {
            Subtitle s = subtitles.get(i);
            sb.append(i + 1).append("\n");
            sb.append(formatSrtTime(s.getStartTime())).append(" --> ").append(formatSrtTime(s.getEndTime())).append("\n");
            sb.append(s.getText()).append("\n\n");
        }
        return sb.toString();
    }
    
    private String exportToAss(List<Subtitle> subtitles) {
        StringBuilder sb = new StringBuilder();
        sb.append("[Script Info]\n");
        sb.append("Title: Edict Export\n");
        sb.append("ScriptType: v4.00+\n\n");
        sb.append("[V4+ Styles]\n");
        sb.append("Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n");
        sb.append("Style: Default,Arial,20,\u0026H00FFFFFF,\u0026H000000FF,\u0026H00000000,\u0026H00000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1\n\n");
        sb.append("[Events]\n");
        sb.append("Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n");
        
        for (Subtitle s : subtitles) {
            sb.append(String.format("Dialogue: 0,%s,%s,Default,%s,0,0,0,,%s\n",
                formatAssTime(s.getStartTime()),
                formatAssTime(s.getEndTime()),
                s.getSpeaker() != null ? s.getSpeaker() : "",
                s.getText().replace("\n", "\\N")
            ));
        }
        return sb.toString();
    }
    
    private String exportToVtt(List<Subtitle> subtitles) {
        StringBuilder sb = new StringBuilder();
        sb.append("WEBVTT\n\n");
        
        for (int i = 0; i < subtitles.size(); i++) {
            Subtitle s = subtitles.get(i);
            sb.append(i + 1).append("\n");
            sb.append(formatVttTime(s.getStartTime())).append(" --> ").append(formatVttTime(s.getEndTime())).append("\n");
            sb.append(s.getText()).append("\n\n");
        }
        return sb.toString();
    }
    
    // 时间转换工具方法
    private LocalTime parseSrtTime(String timeStr) {
        // 00:00:00,000
        timeStr = timeStr.replace(',', '.');
        return LocalTime.parse(timeStr);
    }
    
    private LocalTime parseAssTime(String timeStr) {
        // 0:00:00.00
        if (timeStr.split(":").length == 3) {
            String[] parts = timeStr.split(":");
            int hours = Integer.parseInt(parts[0]);
            int minutes = Integer.parseInt(parts[1]);
            double seconds = Double.parseDouble(parts[2]);
            return LocalTime.of(hours % 24, minutes, (int)seconds, (int)((seconds % 1) * 1_000_000_000));
        }
        return LocalTime.parse(timeStr);
    }
    
    private LocalTime parseVttTime(String timeStr) {
        // 00:00:00.000
        return LocalTime.parse(timeStr);
    }
    
    private long srtTimeToMs(String timeStr) {
        // 00:00:00,000
        String[] parts = timeStr.replace(',', '.').split(":\\.");
        int hours = Integer.parseInt(parts[0]);
        int minutes = Integer.parseInt(parts[1]);
        int seconds = Integer.parseInt(parts[2]);
        int ms = parts.length > 3 ? Integer.parseInt(parts[3]) : 0;
        return hours * 3600000L + minutes * 60000L + seconds * 1000L + ms;
    }
    
    private long assTimeToMs(String timeStr) {
        // 0:00:00.00
        String[] parts = timeStr.split(":");
        int hours = Integer.parseInt(parts[0]);
        int minutes = Integer.parseInt(parts[1]);
        double seconds = Double.parseDouble(parts[2]);
        return hours * 3600000L + minutes * 60000L + (long)(seconds * 1000);
    }
    
    private long vttTimeToMs(String timeStr) {
        // 00:00:00.000
        String[] parts = timeStr.split(":\\.");
        int hours = Integer.parseInt(parts[0]);
        int minutes = Integer.parseInt(parts[1]);
        int seconds = Integer.parseInt(parts[2]);
        int ms = parts.length > 3 ? Integer.parseInt(parts[3]) : 0;
        return hours * 3600000L + minutes * 60000L + seconds * 1000L + ms;
    }
    
    private long timeToMs(LocalTime time) {
        return time.getHour() * 3600000L + 
               time.getMinute() * 60000L + 
               time.getSecond() * 1000L + 
               time.getNano() / 1_000_000;
    }
    
    private String formatSrtTime(LocalTime time) {
        return String.format("%02d:%02d:%02d,%03d",
            time.getHour(), time.getMinute(), time.getSecond(), time.getNano() / 1_000_000);
    }
    
    private String formatAssTime(LocalTime time) {
        return String.format("%d:%02d:%02d.%02d",
            time.getHour(), time.getMinute(), time.getSecond(), (time.getNano() / 1_000_000) / 10);
    }
    
    private String formatVttTime(LocalTime time) {
        return String.format("%02d:%02d:%02d.%03d",
            time.getHour(), time.getMinute(), time.getSecond(), time.getNano() / 1_000_000);
    }
    
    private SubtitleDTO convertToDTO(Subtitle subtitle) {
        SubtitleDTO dto = new SubtitleDTO();
        dto.setId(subtitle.getId());
        dto.setProjectId(subtitle.getProject().getId());
        dto.setSubIndex(subtitle.getSubIndex());
        dto.setStartTime(subtitle.getStartTime());
        dto.setEndTime(subtitle.getEndTime());
        dto.setStartTimeMs(subtitle.getStartTimeMs());
        dto.setEndTimeMs(subtitle.getEndTimeMs());
        dto.setText(subtitle.getText());
        dto.setSpeaker(subtitle.getSpeaker());
        dto.setNote(subtitle.getNote());
        dto.setCreatedAt(subtitle.getCreatedAt());
        dto.setUpdatedAt(subtitle.getUpdatedAt());
        return dto;
    }
}
