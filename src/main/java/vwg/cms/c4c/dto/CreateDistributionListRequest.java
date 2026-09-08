package vwg.cms.c4c.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CreateDistributionListRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Email @Size(max = 120) String email,
        @NotEmpty List<@Email @Size(max = 120) String> memberEmails
) {
}