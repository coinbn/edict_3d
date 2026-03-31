package com.edict;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import com.edict.config.OpenClawProperties;

@SpringBootApplication
@EnableScheduling
@EnableAsync
@EnableConfigurationProperties(OpenClawProperties.class)
public class EdictApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(EdictApplication.class, args);
    }
}
