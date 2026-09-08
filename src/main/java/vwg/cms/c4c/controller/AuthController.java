package vwg.cms.c4c.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vwg.cms.c4c.dto.UserProfileResponse;
import vwg.cms.c4c.service.AppUserService;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AppUserService appUserService;

    @GetMapping("/me")
    public UserProfileResponse me(Authentication authentication) {
        String username = appUserService.resolveActorUsername(authentication);
        return appUserService.toProfile(appUserService.getRequiredUser(username));
    }
}

