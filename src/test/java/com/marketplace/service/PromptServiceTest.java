package com.marketplace.service;

import com.marketplace.api.exception.UnauthorizedException;
import com.marketplace.domain.Prompt;
import com.marketplace.domain.enums.PromptStatus;
import com.marketplace.domain.enums.PromptType;
import com.marketplace.domain.enums.TargetRole;
import com.marketplace.repository.PromptRepository;
import com.marketplace.repository.PurchaseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class PromptServiceTest {

    @Mock
    private PromptRepository promptRepository;

    @Mock
    private PurchaseRepository purchaseRepository;

    @InjectMocks
    private PromptService promptService;

    private Prompt prompt;

    @BeforeEach
    void setUp() {
        prompt = Prompt.builder()
                .sellerId(1L)
                .title("Test Prompt")
                .description("Test Description")
                .content("Full content of the prompt")
                .previewContent("Full content")
                .type(PromptType.AGENT)
                .targetRole(TargetRole.DEVELOPER)
                .price(0)
                .tags(List.of("java", "spring"))
                .status(PromptStatus.PUBLIC)
                .build();
    }

    @Test
    void findPromptDetail_구매한_사용자는_purchased_true와_전체_content_반환() {
        Long promptId = 1L;
        Long buyerId = 2L;
        given(promptRepository.findById(promptId)).willReturn(Optional.of(prompt));
        given(purchaseRepository.existsByBuyerIdAndPromptId(buyerId, promptId)).willReturn(true);

        PromptService.PromptDetail result = promptService.findPromptDetail(promptId, buyerId);

        assertThat(result.purchased()).isTrue();
        assertThat(result.getPrompt()).isNotNull();
        assertThat(result.getPrompt().getContent()).isEqualTo("Full content of the prompt");
    }

    @Test
    void findPromptDetail_미구매_사용자는_purchased_false와_content_null_반환() {
        Long promptId = 1L;
        Long buyerId = 2L;
        given(promptRepository.findById(promptId)).willReturn(Optional.of(prompt));
        given(purchaseRepository.existsByBuyerIdAndPromptId(buyerId, promptId)).willReturn(false);

        PromptService.PromptDetail result = promptService.findPromptDetail(promptId, buyerId);

        assertThat(result.purchased()).isFalse();
        assertThat(result.getPrompt()).isNull();
        assertThat(result.getPromptView()).isNotNull();
        assertThat(result.getPromptView().previewContent()).isEqualTo("Full content");
    }

    @Test
    void createPrompt_50KB_초과_content_입력시_IllegalArgumentException() {
        String oversizedContent = "x".repeat(51201);

        assertThatThrownBy(() ->
                promptService.createPrompt(1L, "title", "desc", oversizedContent,
                        PromptType.CLAUDE_MD, TargetRole.DEVELOPER, 0, List.of(), PromptStatus.PUBLIC))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("50KB");
    }

    @Test
    void createPrompt_previewContent가_content_앞_500자로_자동생성() {
        String longContent = "A".repeat(1000);
        Prompt savedPrompt = Prompt.builder()
                .sellerId(1L)
                .title("title")
                .description("desc")
                .content(longContent)
                .previewContent(longContent.substring(0, 500))
                .type(PromptType.AGENT)
                .targetRole(TargetRole.DEVELOPER)
                .price(0)
                .tags(List.of())
                .build();
        given(promptRepository.save(any(Prompt.class))).willReturn(savedPrompt);

        Prompt result = promptService.createPrompt(1L, "title", "desc", longContent,
                PromptType.AGENT, TargetRole.DEVELOPER, 0, List.of(), PromptStatus.PUBLIC);

        assertThat(result.getPreviewContent()).hasSize(500);
        assertThat(result.getPreviewContent()).isEqualTo("A".repeat(500));
    }

    @Test
    void deletePrompt_본인이_아닌_sellerId로_삭제시_UnauthorizedException() {
        Long promptId = 1L;
        Long otherSellerId = 99L;
        given(promptRepository.findById(promptId)).willReturn(Optional.of(prompt));

        assertThatThrownBy(() -> promptService.deletePrompt(promptId, otherSellerId))
                .isInstanceOf(UnauthorizedException.class);
    }
}
