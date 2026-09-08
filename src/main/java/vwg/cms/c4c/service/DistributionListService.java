package vwg.cms.c4c.service;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vwg.cms.c4c.dto.CreateDistributionListRequest;
import vwg.cms.c4c.dto.DistributionListResponse;
import vwg.cms.c4c.entity.AppUser;
import vwg.cms.c4c.entity.DistributionList;
import vwg.cms.c4c.exception.ConflictException;
import vwg.cms.c4c.exception.BadRequestException;
import vwg.cms.c4c.exception.ForbiddenOperationException;
import vwg.cms.c4c.repository.DistributionListRepository;

@Service
@RequiredArgsConstructor
public class DistributionListService {

    private final DistributionListRepository repository;
    private final AppUserService appUserService;

    @Transactional
    public DistributionListResponse create(CreateDistributionListRequest request, String actorUsername) {
        AppUser actor = appUserService.getRequiredUser(actorUsername);
        if (!appUserService.canManageDistributionLists(actor)) {
            throw new ForbiddenOperationException("Only Admin and Sub Admin users can create distribution lists");
        }
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (repository.findByEmailIgnoreCase(email).isPresent() || repository.existsByNameIgnoreCase(request.name().trim())) {
            throw new ConflictException("A distribution list with this name or email already exists");
        }
        LinkedHashSet<String> memberEmails = request.memberEmails().stream()
            .map(value -> value.trim().toLowerCase(Locale.ROOT))
            .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));
        List<String> unknownMembers = memberEmails.stream()
            .filter(emailAddress -> appUserService.findUsernameByEmail(emailAddress).isEmpty())
            .toList();
        if (!unknownMembers.isEmpty()) {
            throw new BadRequestException("These DL members are not registered users: " + String.join(", ", unknownMembers));
        }
        DistributionList list = new DistributionList();
        list.setName(request.name().trim());
        list.setEmail(email);
        list.setMemberEmails(memberEmails);
        list.setCreatedBy(actorUsername);
        return toResponse(repository.save(list));
    }

    @Transactional(readOnly = true)
    public List<DistributionListResponse> list(String actorUsername) {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public DistributionList findByEmail(String email) {
        return repository.findByEmailIgnoreCase(email).orElse(null);
    }

    private DistributionListResponse toResponse(DistributionList list) {
        return new DistributionListResponse(list.getId(), list.getName(), list.getEmail(), list.getMemberEmails(), list.getCreatedBy(), list.getCreatedAt());
    }
}