package com.edict.controller;

import com.edict.dto.*;
import com.edict.service.MorningBriefService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 早报控制器 - 新闻采集与摘要
 */
@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@RequestMapping("/morning-brief")
public class MorningBriefController {
    
    private final MorningBriefService morningBriefService;
    
    @GetMapping
    public MorningBriefDTO getMorningBrief() {
        return morningBriefService.getMorningBrief();
    }
    
    @PostMapping("/refresh")
    public ActionResultDTO refreshMorningBrief() {
        return morningBriefService.refreshMorningBrief();
    }
    
    @GetMapping("/config")
    public MorningConfigDTO getConfig() {
        return morningBriefService.getConfig();
    }
    
    @PostMapping("/config")
    public ActionResultDTO saveConfig(@RequestBody MorningConfigDTO config) {
        return morningBriefService.saveConfig(config);
    }
}
