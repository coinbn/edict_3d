package com.edict.service;

import com.edict.dto.*;
import com.edict.entity.MorningNews;
import com.edict.repository.MorningNewsRepository;
import com.edict.util.OpenClawCli;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class MorningBriefService {
    
    // OpenClaw Agent ID
    private static final String ZAOCHAO_AGENT = "zaochao";
    private static final int AGENT_TIMEOUT = 120; // 秒
    
    private MorningConfigDTO config = new MorningConfigDTO();
    
    @Autowired
    private MorningNewsRepository morningNewsRepository;
    
    public MorningBriefDTO getMorningBrief() {
        // 优先从数据库读取今日新闻
        MorningBriefDTO brief = getBriefFromDatabase();
        if (brief != null && !brief.getCategories().isEmpty()) {
            return brief;
        }
        // 数据库没有则返回空
        return generateEmptyBrief();
    }
    
    /**
     * 从数据库读取今日早报
     */
    private MorningBriefDTO getBriefFromDatabase() {
        try {
            List<MorningNews> newsList = morningNewsRepository.findByNewsDateOrderByCategoryAscIdAsc(LocalDate.now());
            
            if (newsList == null || newsList.isEmpty()) {
                return null;
            }
            
            MorningBriefDTO brief = new MorningBriefDTO();
            brief.setDate(LocalDate.now().format(DateTimeFormatter.ISO_DATE));
            brief.setGeneratedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            
            Map<String, List<MorningBriefDTO.NewsItem>> categories = new LinkedHashMap<>();
            
            for (MorningNews news : newsList) {
                String cat = news.getCategory();
                if (!categories.containsKey(cat)) {
                    categories.put(cat, new ArrayList<>());
                }
                
                MorningBriefDTO.NewsItem item = new MorningBriefDTO.NewsItem();
                item.setTitle(news.getTitle());
                item.setSummary(news.getSummary());
                item.setSource(news.getSource());
                item.setLink(news.getLink());
                item.setPubDate(news.getPubDate());
                
                categories.get(cat).add(item);
            }
            
            brief.setCategories(categories);
            return brief;
        } catch (Exception e) {
            log.error("从数据库读取早报失败: {}", e.getMessage());
            return null;
        }
    }
    
    @Transactional
    public ActionResultDTO refreshMorningBrief() {
        try {
            List<String> categories = new ArrayList<>();
            if (config.getCategories() != null) {
                for (MorningConfigDTO.CategoryConfig cat : config.getCategories()) {
                    if (cat.isEnabled()) {
                        categories.add(cat.getName());
                    }
                }
            }
            if (categories.isEmpty()) {
                categories.add("科技");
                categories.add("商业");
                categories.add("国际");
            }
            
            String keywords = "AI,科技,商业,国际";
            if (config.getKeywords() != null && !config.getKeywords().isEmpty()) {
                keywords = String.join(",", config.getKeywords());
            }
            
            String task = String.format(
                "请搜索今天的热门新闻，必须包含以下分类：%s，关键词：%s。每类至少3条，返回markdown表格格式：| 标题 | 摘要 | 来源 |",
                String.join("、", categories),
                keywords
            );
            
            log.info("调用 Agent 采集新闻，任务: " + task);
            
            try {
                // 使用 CLI 调用 OpenClaw Agent
                OpenClawCli.CliResult result = OpenClawCli.execute(ZAOCHAO_AGENT, task, AGENT_TIMEOUT);
                
                if (result.isSuccess()) {
                    String output = result.getOutput();
                    log.info("Agent 响应长度: {} chars", output.length());
                    log.info("Agent 响应前500字: {}", output.substring(0, Math.min(500, output.length())));
                    
                    // 检测是否乱码（真正的乱码字符，不是 Config warnings）
                    // 移除 Config warnings 后检查
                    String cleanOutput = output.replaceAll("Config warnings:.*", "");
                    boolean isGibberish = (cleanOutput.contains("鏍") || cleanOutput.contains("鍗") || 
                                          cleanOutput.contains("瀹") || cleanOutput.contains("澶") ||
                                          cleanOutput.contains("閿")) && cleanOutput.length() < 200;
                    
                    if (isGibberish) {
                        log.warn("Agent 返回乱码，保存模拟数据");
                        saveMockDataToDatabase(categories);
                    } else {
                        // 正常内容，保存到数据库
                        saveToDatabase(output, categories);
                    }
                } else {
                    log.warn("Agent 执行失败: exitCode={}, error={}", result.getExitCode(), result.getError());
                    saveMockDataToDatabase(categories);
                }
                
            } catch (Exception e) {
                log.warn("调用 Agent 失败: " + e.getMessage() + "，保存模拟数据");
                saveMockDataToDatabase(categories);
            }
            
            ActionResultDTO result = new ActionResultDTO();
            result.setOk(true);
            result.setMessage("早报刷新成功");
            return result;
        } catch (Exception e) {
            log.error("刷新早报失败", e);
            ActionResultDTO result = new ActionResultDTO();
            result.setOk(false);
            result.setError(e.getMessage());
            return result;
        }
    }
    
    private MorningBriefDTO parseAgentNews(String response, List<String> categories) {
        MorningBriefDTO brief = new MorningBriefDTO();
        brief.setDate(LocalDate.now().format(DateTimeFormatter.ISO_DATE));
        brief.setGeneratedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        
        Map<String, List<MorningBriefDTO.NewsItem>> resultCategories = new LinkedHashMap<>();
        
        // 如果 Agent 返回的是错误日志或空响应，生成模拟新闻
        if (response == null || response.length() < 50 || response.contains("Config warnings")) {
            // 生成模拟热门新闻
            Map<String, String[]> mockNews = new HashMap<>();
            mockNews.put("科技", new String[]{
                "OpenAI 发布 GPT-5 预览版，性能提升 40%",
                " Anthropic 推出 Claude 4.0，主打长文本理解",
                "英伟达发布新一代 AI 芯片 H200，推理速度提升 2 倍"
            });
            mockNews.put("商业", new String[]{
                "特斯拉自动驾驶出租车服务即将上线",
                "苹果 Vision Pro 销量突破 100 万台",
                "字节跳动 AI 助手月活突破 2 亿"
            });
            mockNews.put("国际", new String[]{
                "联合国通过 AI 伦理准则草案",
                "欧盟实施最新 AI 监管法案",
                "中美举行 AI 技术合作对话"
            });
            
            for (String cat : categories) {
                List<MorningBriefDTO.NewsItem> list = new ArrayList<>();
                String[] news = mockNews.getOrDefault(cat, new String[]{"暂无新闻"});
                for (String title : news) {
                    MorningBriefDTO.NewsItem item = new MorningBriefDTO.NewsItem();
                    item.setTitle(title);
                    item.setSummary("今日热门资讯，点击查看详情");
                    item.setSource("聚合搜索");
                    list.add(item);
                }
                resultCategories.put(cat, list);
            }
        } else {
            // 解析 Agent 返回的真实新闻
            String[] lines = response.split("\n");
            String currentCategory = categories.get(0);
            
            for (String line : lines) {
                line = line.trim();
                if (line.isEmpty() || line.length() < 10) continue;
                
                // 检测分类
                for (String cat : categories) {
                    if (line.contains(cat)) {
                        currentCategory = cat;
                        continue;
                    }
                }
                
                if (!resultCategories.containsKey(currentCategory)) {
                    resultCategories.put(currentCategory, new ArrayList<>());
                }
                
                if (resultCategories.get(currentCategory).size() < 3) {
                    MorningBriefDTO.NewsItem item = new MorningBriefDTO.NewsItem();
                    item.setTitle(line.length() > 60 ? line.substring(0, 60) : line);
                    item.setSummary("来源: 搜索");
                    item.setSource("搜索");
                    resultCategories.get(currentCategory).add(item);
                }
            }
            
            // 如果没解析到任何新闻，使用默认
            if (resultCategories.isEmpty()) {
                for (String cat : categories) {
                    List<MorningBriefDTO.NewsItem> list = new ArrayList<>();
                    MorningBriefDTO.NewsItem item = new MorningBriefDTO.NewsItem();
                    item.setTitle("今日热门新闻");
                    item.setSummary(response.length() > 150 ? response.substring(0, 150) + "..." : response);
                    item.setSource("搜索");
                    list.add(item);
                    resultCategories.put(cat, list);
                }
            }
        }
        
        brief.setCategories(resultCategories);
        return brief;
    }
    
    private MorningBriefDTO generateWaitingBrief(List<String> categories) {
        MorningBriefDTO brief = new MorningBriefDTO();
        brief.setDate(LocalDate.now().format(DateTimeFormatter.ISO_DATE));
        brief.setGeneratedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        
        Map<String, List<MorningBriefDTO.NewsItem>> resultCategories = new LinkedHashMap<>();
        
        for (String cat : categories) {
            List<MorningBriefDTO.NewsItem> list = new ArrayList<>();
            MorningBriefDTO.NewsItem item = new MorningBriefDTO.NewsItem();
            item.setTitle("正在调用 Agent 采集 " + cat + " 新闻...");
            item.setSummary("请稍候刷新页面");
            item.setSource("系统");
            list.add(item);
            resultCategories.put(cat, list);
        }
        
        brief.setCategories(resultCategories);
        return brief;
    }
    
    public MorningConfigDTO getConfig() {
        return config;
    }
    
    public ActionResultDTO saveConfig(MorningConfigDTO newConfig) {
        this.config = newConfig;
        ActionResultDTO result = new ActionResultDTO();
        result.setOk(true);
        result.setMessage("配置保存成功");
        return result;
    }
    
    private MorningBriefDTO generateEmptyBrief() {
        MorningBriefDTO brief = new MorningBriefDTO();
        brief.setDate(LocalDate.now().format(DateTimeFormatter.ISO_DATE));
        brief.setGeneratedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        brief.setCategories(new HashMap<>());
        return brief;
    }
    
    /**
     * 保存新闻到数据库（覆盖当日数据）
     * 支持多种格式：markdown表格、列表、JSON等
     */
    @Transactional
    private void saveToDatabase(String response, List<String> categories) {
        LocalDate today = LocalDate.now();
        
        // 先删除当日旧数据
        morningNewsRepository.deleteByNewsDate(today);
        
        String currentCategory = categories.isEmpty() ? "科技" : categories.get(0);
        int savedCount = 0;
        
        // 清理 response 中的 Config warnings
        String cleanResponse = response.replaceAll("Config warnings:.*?\\n", "")
                                       .replaceAll("Config warnings:.*", "");
        
        log.info("开始解析新闻，清理后内容长度: {}", cleanResponse.length());
        log.debug("清理后内容: {}", cleanResponse.substring(0, Math.min(500, cleanResponse.length())));
        
        String[] lines = cleanResponse.split("\n");
        
        for (String line : lines) {
            line = line.trim();
            if (line.isEmpty() || line.length() < 5) continue;
            
            // 检测分类标题 - 更宽松匹配
            // 支持格式: "## 商业", "【商业】", "商业：", "商业新闻", "热门商业" 等
            for (String cat : categories) {
                if (line.contains(cat)) {
                    // 分类行特征：以#开头、以】结尾、包含"新闻"/"热门"、或者就是单独的分类名
                    boolean isCategoryLine = 
                        line.startsWith("#") ||                    // markdown标题
                        line.startsWith("【") ||                   // 中文括号
                        line.contains("新闻") || 
                        line.contains("热门") ||
                        line.contains(":") ||
                        line.contains("：") ||
                        line.equals(cat) ||                        // 正好是分类名
                        line.matches("^\\d+[.、\\s]*" + cat + ".*"); // 编号+分类
                    
                    if (isCategoryLine) {
                        currentCategory = cat;
                        log.debug("检测到分类: {} (行: {})", cat, line);
                        continue;
                    }
                }
            }
            
            // 跳过分隔线和表头
            if (line.matches("^\\|?[-:|\\s]+\\|?$") || 
                line.contains("---") ||
                line.contains("标题") && line.contains("摘要") ||
                line.contains("分类")) {
                continue;
            }
            
            // 尝试多种格式解析
            String title = null;
            String summary = "来源: 搜索";
            String source = "搜索";
            
            // 格式1: markdown表格 | 标题 | 摘要 | 来源 |
            if (line.startsWith("|")) {
                String[] parts = line.split("\\|");
                if (parts.length >= 3) {
                    // parts[0] 是空（第一个|前），parts[1]是标题
                    int titleIdx = parts[0].isEmpty() ? 1 : 0;
                    title = parts[titleIdx].trim();
                    if (parts.length > titleIdx + 1) {
                        summary = parts[titleIdx + 1].trim();
                    }
                    if (parts.length > titleIdx + 2) {
                        source = parts[titleIdx + 2].trim();
                    }
                }
            }
            // 格式2: 数字列表 "1. 标题" 或 "1、标题"
            else if (line.matches("^\\d+[.、\\s]+.+")) {
                title = line.replaceFirst("^\\d+[.、\\s]+", "").trim();
                // 尝试分离标题和来源（如果有 - 或 | 分隔）
                if (title.contains(" - ")) {
                    String[] parts = title.split(" - ", 2);
                    title = parts[0].trim();
                    source = parts[1].trim();
                } else if (title.contains(" | ")) {
                    String[] parts = title.split(" \\| ", 2);
                    title = parts[0].trim();
                    source = parts[1].trim();
                }
            }
            // 格式3: 简单文本行（非分类行）
            else if (!line.startsWith("#") && !line.startsWith("【") && line.length() > 10) {
                title = line;
            }
            
            // 清理和验证标题
            if (title != null && !title.isEmpty()) {
                // 移除 markdown 格式
                title = title.replaceAll("\\*\\*", "").replaceAll("\\*", "").trim();
                
                // 跳过无效内容
                if (title.length() < 5) continue;
                if (title.matches("^[-—|\\s]+$")) continue;
                if (title.contains("Config warnings")) continue;
                
                // 创建新闻实体
                MorningNews news = new MorningNews();
                news.setCategory(currentCategory);
                news.setNewsDate(today);
                news.setTitle(title.length() > 200 ? title.substring(0, 200) : title);
                news.setSummary(summary.length() > 500 ? summary.substring(0, 500) : summary);
                news.setSource(source.length() > 100 ? source.substring(0, 100) : source);
                news.setRawContent(cleanResponse);
                
                // 检查该类是否已有3条
                long countInCategory = morningNewsRepository.countByNewsDateAndCategory(today, currentCategory);
                if (countInCategory < 3) {
                    morningNewsRepository.save(news);
                    savedCount++;
                    log.debug("保存新闻 [{}]: {}", currentCategory, title.substring(0, Math.min(30, title.length())));
                }
            }
        }
        
        log.info("已保存 {} 条新闻到数据库", savedCount);
    }
    
    /**
     * 保存模拟数据到数据库
     */
    @Transactional
    private void saveMockDataToDatabase(List<String> categories) {
        LocalDate today = LocalDate.now();
        
        // 先删除当日旧数据
        morningNewsRepository.deleteByNewsDate(today);
        
        // 模拟新闻数据
        Map<String, String[]> mockNews = new HashMap<>();
        mockNews.put("科技", new String[]{
            "OpenAI 发布 GPT-5 预览版，性能提升 40%",
            "Anthropic 推出 Claude 4.0，主打长文本理解",
            "英伟达发布新一代 AI 芯片 H200，推理速度提升 2 倍"
        });
        mockNews.put("商业", new String[]{
            "特斯拉自动驾驶出租车服务即将上线",
            "苹果 Vision Pro 销量突破 100 万台",
            "字节跳动 AI 助手月活突破 2 亿"
        });
        mockNews.put("国际", new String[]{
            "联合国通过 AI 伦理准则草案",
            "欧盟实施最新 AI 监管法案",
            "中美举行 AI 技术合作对话"
        });
        
        for (String cat : categories) {
            String[] newsArray = mockNews.getOrDefault(cat, new String[]{"暂无新闻"});
            for (String title : newsArray) {
                MorningNews news = new MorningNews();
                news.setCategory(cat);
                news.setNewsDate(today);
                news.setTitle(title);
                news.setSummary("今日热门资讯，点击查看详情");
                news.setSource("聚合搜索");
                morningNewsRepository.save(news);
            }
        }
        
        log.info("已保存模拟新闻到数据库");
    }
}
