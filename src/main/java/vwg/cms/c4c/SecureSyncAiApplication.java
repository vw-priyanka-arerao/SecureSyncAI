package vwg.cms.c4c;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SecureSyncAiApplication {

    public static void main(String[] args) {
        SpringApplication.run(SecureSyncAiApplication.class, args);
    }
}
