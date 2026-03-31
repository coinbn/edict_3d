package com.edict.service;

import com.edict.dto.ProjectDTO;
import com.edict.entity.Project;
import com.edict.repository.ProjectRepository;
import com.edict.repository.SubtitleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectService {
    
    private final ProjectRepository projectRepository;
    private final SubtitleRepository subtitleRepository;
    private final FFmpegService ffmpegService;
    
    @Value("${edict.upload.video-path}")
    private String videoPath;
    
    @Transactional(readOnly = true)
    public List<ProjectDTO> getAllProjects() {
        return projectRepository.findAllByOrderByUpdatedAtDesc()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public ProjectDTO getProject(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("项目不存在"));
        return convertToDTO(project);
    }
    
    @Transactional
    public ProjectDTO createProject(String name, String description) {
        Project project = new Project();
        project.setName(name);
        project.setDescription(description);
        project.setStatus(Project.ProjectStatus.ACTIVE);
        
        Project saved = projectRepository.save(project);
        return convertToDTO(saved);
    }
    
    @Transactional
    public ProjectDTO updateProject(Long id, String name, String description) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("项目不存在"));
        
        project.setName(name);
        project.setDescription(description);
        
        Project saved = projectRepository.save(project);
        return convertToDTO(saved);
    }
    
    @Transactional
    public void deleteProject(Long id) {
        projectRepository.deleteById(id);
    }
    
    @Transactional
    public ProjectDTO uploadVideo(Long projectId, MultipartFile file) throws IOException {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("项目不存在"));
        
        // 创建存储目录
        Path uploadDir = Paths.get(videoPath);
        if (!Files.exists(uploadDir)) {
            Files.createDirectories(uploadDir);
        }
        
        // 生成文件名
        String originalName = file.getOriginalFilename();
        String ext = originalName != null ? originalName.substring(originalName.lastIndexOf(".")) : ".mp4";
        String fileName = UUID.randomUUID() + ext;
        Path targetPath = uploadDir.resolve(fileName);
        
        // 保存文件
        Files.copy(file.getInputStream(), targetPath);
        
        // 更新项目
        project.setVideoPath(targetPath.toString());
        project.setVideoName(originalName);
        
        // 获取视频信息
        FFmpegService.VideoInfo info = ffmpegService.getVideoInfo(targetPath.toString());
        if (info != null) {
            project.setVideoDuration(info.getDuration());
            project.setVideoWidth(info.getWidth());
            project.setVideoHeight(info.getHeight());
        }
        
        Project saved = projectRepository.save(project);
        return convertToDTO(saved);
    }
    
    private ProjectDTO convertToDTO(Project project) {
        ProjectDTO dto = new ProjectDTO();
        dto.setId(project.getId());
        dto.setName(project.getName());
        dto.setDescription(project.getDescription());
        dto.setVideoPath(project.getVideoPath());
        dto.setVideoName(project.getVideoName());
        dto.setAudioPath(project.getAudioPath());
        dto.setVideoDuration(project.getVideoDuration());
        dto.setVideoWidth(project.getVideoWidth());
        dto.setVideoHeight(project.getVideoHeight());
        dto.setStatus(project.getStatus().name());
        dto.setSubtitleCount((int) subtitleRepository.countByProjectId(project.getId()));
        dto.setCreatedAt(project.getCreatedAt());
        dto.setUpdatedAt(project.getUpdatedAt());
        return dto;
    }
}
