package vwg.cms.c4c.controller;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vwg.cms.c4c.dto.UserProfileResponse;
import vwg.cms.c4c.service.AppUserService;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final AppUserService appUserService;

    @GetMapping
    public List<UserProfileResponse> listUsers(
            @RequestParam(defaultValue = "false") boolean reviewersOnly,
            Authentication authentication
    ) {
        appUserService.resolveActorUsername(authentication);
        return appUserService.listUsers(reviewersOnly);
    }
}

