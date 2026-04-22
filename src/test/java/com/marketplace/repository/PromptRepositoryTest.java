package com.marketplace.repository;

import com.marketplace.domain.Prompt;
import com.marketplace.domain.enums.PromptStatus;
import com.marketplace.domain.enums.PromptType;
import com.marketplace.domain.enums.TargetRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class PromptRepositoryTest {

    @Autowired
    private PromptRepository promptRepository;

    @BeforeEach
    void setUp() {
        promptRepository.saveAll(List.of(
            Prompt.builder()
                .sellerId(1L)
                .title("Spring Boot CLAUDE.md")
                .description("Spring Boot project instructions")
                .content("full content")
                .previewContent("preview")
                .type(PromptType.CLAUDE_MD)
                .targetRole(TargetRole.DEVELOPER)
                .price(0)
                .build(),
            Prompt.builder()
                .sellerId(1L)
                .title("Architect Agent")
                .description("Agent for system design")
                .content("full content")
                .previewContent("preview")
                .type(PromptType.AGENT)
                .targetRole(TargetRole.PLANNER)
                .price(1000)
                .build(),
            Prompt.builder()
                .sellerId(2L)
                .title("Review Skill")
                .description("Code review slash command")
                .content("full content")
                .previewContent("preview")
                .type(PromptType.SKILL)
                .targetRole(TargetRole.DEVELOPER)
                .price(500)
                .build()
        ));
    }

    @Test
    void findWithFilters_typeOnly_returnsMatchingType() {
        Page<Prompt> result = promptRepository.findWithFilters(
            PromptType.AGENT, null, null, null, PageRequest.of(0, 10)
        );

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getType()).isEqualTo(PromptType.AGENT);
    }

    @Test
    void findWithFilters_keyword_matchesTitleContaining() {
        Page<Prompt> result = promptRepository.findWithFilters(
            null, null, null, "Spring Boot", PageRequest.of(0, 10)
        );

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getTitle()).contains("Spring Boot");
    }

    @Test
    void findWithFilters_allNullParams_returnsAll() {
        Page<Prompt> result = promptRepository.findWithFilters(
            null, null, null, null, PageRequest.of(0, 10)
        );

        assertThat(result.getContent()).hasSize(3);
    }

    @Test
    void findWithFilters_statusFilter_returnsOnlyPublic() {
        promptRepository.saveAll(List.of(
            Prompt.builder()
                .sellerId(1L)
                .title("Public Prompt")
                .description("Public")
                .content("content")
                .previewContent("preview")
                .type(PromptType.CLAUDE_MD)
                .targetRole(TargetRole.DEVELOPER)
                .price(0)
                .status(PromptStatus.PUBLIC)
                .build()
        ));

        Page<Prompt> result = promptRepository.findWithFilters(
            null, null, PromptStatus.PUBLIC, null, PageRequest.of(0, 10)
        );

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getStatus()).isEqualTo(PromptStatus.PUBLIC);
    }
}
