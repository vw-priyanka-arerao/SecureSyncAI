package vwg.cms.c4c.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import vwg.cms.c4c.model.Role;
import vwg.cms.c4c.repository.AppUserRepository;
import vwg.cms.c4c.service.AppUserService;

@Configuration
@RequiredArgsConstructor
public class DemoDataInitializer {

    private final AppUserRepository appUserRepository;
    private final AppUserService appUserService;
    private final PasswordEncoder passwordEncoder;

    @Bean
    CommandLineRunner seedUsers(@Value("${app.security.demo-password}") String demoPassword) {
        return args -> {
            if (appUserRepository.count() > 0) {
                return;
            }
            String encodedPassword = passwordEncoder.encode(demoPassword);
            appUserRepository.save(appUserService.buildDemoUser("employee1", "Employee One", "employee1@securesync.local", Role.EMPLOYEE, encodedPassword));
            appUserRepository.save(appUserService.buildDemoUser("sdm1", "SDM One", "sdm1@securesync.local", Role.SDM, encodedPassword));
            appUserRepository.save(appUserService.buildDemoUser("pdhead1", "PD Head One", "pdhead1@securesync.local", Role.PD_HEAD, encodedPassword));
            appUserRepository.save(appUserService.buildDemoUser("admin1", "Admin One", "admin1@securesync.local", Role.ADMIN, encodedPassword));
            appUserRepository.save(appUserService.buildDemoUser("auditor1", "Auditor One", "auditor1@securesync.local", Role.AUDITOR, encodedPassword));
        };
    }
}

