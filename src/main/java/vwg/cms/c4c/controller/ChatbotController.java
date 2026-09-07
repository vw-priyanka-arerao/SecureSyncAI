package vwg.cms.c4c.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vwg.cms.c4c.dto.ChatbotQueryRequest;
import vwg.cms.c4c.dto.ChatbotQueryResponse;
import vwg.cms.c4c.service.AppUserService;
import vwg.cms.c4c.service.ChatbotService;

@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;
    private final AppUserService appUserService;

    @PostMapping("/query")
    public ChatbotQueryResponse query(@Valid @RequestBody ChatbotQueryRequest request, Authentication authentication) {
        String actorUsername = appUserService.resolveActorUsername(authentication);
        return chatbotService.search(actorUsername, request);
    }
}

