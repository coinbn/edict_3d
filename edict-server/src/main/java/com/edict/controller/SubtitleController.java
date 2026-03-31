package com.edict.controller;

import com.edict.dto.ApiResponse;
import com.edict.dto.SubtitleDTO;
import com.edict.service.SubtitleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/projects/{projectId}/subtitles")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SubtitleController {
    
    private final SubtitleService subtitleService;
    
    @GetMapping
    public ApiResponse<List<SubtitleDTO>> getSubtitles(@PathVariable Long projectId) {
        return ApiResponse.success(subtitleService.getSubtitlesByProjectId(projectId));
    }
    
    @PostMapping
    public ApiResponse<SubtitleDTO> createSubtitle(
            @PathVariable Long projectId,
            @RequestBody SubtitleDTO dto) {
        return ApiResponse.success(subtitleService.createSubtitle(projectId, dto));
    }
    
    @PutMapping("/{id}")
    public ApiResponse<SubtitleDTO> updateSubtitle(
            @PathVariable Long id,
            @RequestBody SubtitleDTO dto) {
        return ApiResponse.success(subtitleService.updateSubtitle(id, dto));
    }
    
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteSubtitle(@PathVariable Long id) {
        subtitleService.deleteSubtitle(id);
        return ApiResponse.success();
    }
    
    @PostMapping("/import")
    public ApiResponse<List<SubtitleDTO>> importSubtitles(
            @PathVariable Long projectId,
            @RequestParam("file") MultipartFile file) throws IOException {
        return ApiResponse.success(subtitleService.importSubtitles(projectId, file));
    }
    
    @GetMapping("/export")
    public ResponseEntity<String> exportSubtitles(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "srt") String format) {
        String content = subtitleService.exportSubtitles(projectId, format);
        
        String filename = "subtitles." + format;
        MediaType mediaType = format.equals("ass") ? MediaType.parseMediaType("text/x-ssa") : MediaType.TEXT_PLAIN;
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(mediaType)
                .body(content);
    }
}
