package com.edict.controller;

import com.edict.dto.ApiResponse;
import com.edict.dto.ProjectDTO;
import com.edict.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/projects")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProjectController {
    
    private final ProjectService projectService;
    
    @GetMapping
    public ApiResponse<List<ProjectDTO>> getAllProjects() {
        return ApiResponse.success(projectService.getAllProjects());
    }
    
    @GetMapping("/{id}")
    public ApiResponse<ProjectDTO> getProject(@PathVariable Long id) {
        return ApiResponse.success(projectService.getProject(id));
    }
    
    @PostMapping
    public ApiResponse<ProjectDTO> createProject(
            @RequestParam String name,
            @RequestParam(required = false) String description) {
        return ApiResponse.success(projectService.createProject(name, description));
    }
    
    @PutMapping("/{id}")
    public ApiResponse<ProjectDTO> updateProject(
            @PathVariable Long id,
            @RequestParam String name,
            @RequestParam(required = false) String description) {
        return ApiResponse.success(projectService.updateProject(id, name, description));
    }
    
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return ApiResponse.success();
    }
    
    @PostMapping("/{id}/video")
    public ApiResponse<ProjectDTO> uploadVideo(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) throws IOException {
        return ApiResponse.success(projectService.uploadVideo(id, file));
    }
}
