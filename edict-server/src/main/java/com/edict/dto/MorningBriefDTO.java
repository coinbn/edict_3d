package com.edict.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class MorningBriefDTO {
    private String date;
    private String generatedAt;
    private Map<String, List<NewsItem>> categories;
    
    @Data
    public static class NewsItem {
        private String title;
        private String summary;
        private String link;
        private String source;
        private String image;
        private String pubDate;
    }
}
