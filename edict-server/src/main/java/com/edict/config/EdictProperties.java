package com.edict.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "edict")
public class EdictProperties {
    
    private Upload upload = new Upload();
    private Ffmpeg ffmpeg = new Ffmpeg();
    
    @Data
    public static class Upload {
        private String path;
        private String videoPath;
        private String audioPath;
        private String subtitlePath;
    }
    
    @Data
    public static class Ffmpeg {
        private String ffmpegPath;
        private String ffprobePath;
    }
}
