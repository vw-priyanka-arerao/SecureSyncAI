package vwg.cms.c4c.dto;

import vwg.cms.c4c.model.Role;

public record UserProfileResponse(
        Long id,
        String username,
        String displayName,
        String email,
        Role role
) {
}
