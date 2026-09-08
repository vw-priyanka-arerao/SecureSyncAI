package vwg.cms.c4c.controller;

import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vwg.cms.c4c.dto.CreateDistributionListRequest;
import vwg.cms.c4c.dto.DistributionListResponse;
import vwg.cms.c4c.service.AppUserService;
import vwg.cms.c4c.service.DistributionListService;

@RestController
@RequestMapping("/api/distribution-lists")
@RequiredArgsConstructor
public class DistributionListController {

    private final DistributionListService service;
    private final AppUserService appUserService;

    @GetMapping
    public List<DistributionListResponse> list(Authentication authentication) {
        return service.list(appUserService.resolveActorUsername(authentication));
    }

    @PostMapping
    public DistributionListResponse create(@Valid @RequestBody CreateDistributionListRequest request, Authentication authentication) {
        return service.create(request, appUserService.resolveActorUsername(authentication));
    }
}