package com.edict.dto;

import lombok.Data;
import java.util.List;

@Data
public class SubtitleImportDTO {
    private String format;  // srt, ass, vtt
    private String content;
    private List<SubtitleDTO> subtitles;
}
