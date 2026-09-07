package vwg.cms.c4c.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vwg.cms.c4c.dto.DashboardResponse;
import vwg.cms.c4c.service.AppUserService;
import vwg.cms.c4c.service.DashboardService;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final AppUserService appUserService;

    @GetMapping
    public DashboardResponse dashboard(Authentication authentication) {
        return dashboardService.getDashboard(appUserService.resolveActorUsername(authentication));
    }
}
