package com.edict.dto;

import lombok.Data;
import java.util.List;

@Data
public class MorningConfigDTO {
    private List<CategoryConfig> categories;
    private List<String> keywords;
    private List<CustomFeed> customFeeds;
    private String feishuWebhook;
    
    @Data
    public static class CategoryConfig {
        private String name;
        private boolean enabled;
    }
    
    @Data
    public static class CustomFeed {
        private String name;
        private String url;
        private String category;
    }
}
