package com.marketplace.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketplace.api.dto.PromptRequest;
import com.marketplace.api.exception.UnauthorizedException;
import com.marketplace.config.JwtProvider;
import com.marketplace.config.OAuth2SuccessHandler;
import com.marketplace.config.OAuth2UserService;
import com.marketplace.config.SecurityConfig;
import com.marketplace.domain.Prompt;
import com.marketplace.domain.enums.PromptType;
import com.marketplace.domain.enums.TargetRole;
import com.marketplace.service.PromptService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willThrow;
import static org.springframework.security.authentication.UsernamePasswordAuthenticationToken.authenticated;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PromptController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = {
        "spring.security.oauth2.client.registration.google.client-id=test-id",
        "spring.security.oauth2.client.registration.google.client-secret=test-secret",
        "cors.allowed-origins=http://localhost:3000"
})
class PromptControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PromptService promptService;

    @MockBean
    private JwtProvider jwtProvider;

    @MockBean
    private OAuth2UserService oAuth2UserService;

    @MockBean
    private OAuth2SuccessHandler oAuth2SuccessHandler;

    @Test
    void listPrompts_returns200WithPageResponse() throws Exception {
        Prompt mockPrompt = Prompt.builder()
                .sellerId(1L)
                .title("Test Prompt")
                .description("Description")
                .content("content")
                .previewContent("preview...")
                .type(PromptType.AGENT)
                .targetRole(TargetRole.DEVELOPER)
                .price(0)
                .tags(List.of("spring"))
                .build();

        given(promptService.findPrompts(any(), any(), any(), anyInt(), anyInt()))
                .willReturn(new PageImpl<>(List.of(mockPrompt), PageRequest.of(0, 20), 1));

        mockMvc.perform(get("/api/prompts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void createPrompt_withoutAuth_returns401() throws Exception {
        PromptRequest request = new PromptRequest(
                "Title", "Description", "content",
                PromptType.AGENT, TargetRole.DEVELOPER, 0, List.of()
        );

        mockMvc.perform(post("/api/prompts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser
    void deletePrompt_whenUnauthorized_returns403() throws Exception {
        willThrow(new UnauthorizedException("Not authorized to delete this prompt"))
                .given(promptService).deletePrompt(anyLong(), any());

        mockMvc.perform(delete("/api/prompts/1")
                        .with(authentication(authenticated(1L, null, List.of()))))
                .andExpect(status().isForbidden());
    }
}
