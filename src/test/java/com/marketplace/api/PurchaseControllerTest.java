package com.marketplace.api;

import com.marketplace.config.JwtProvider;
import com.marketplace.config.OAuth2SuccessHandler;
import com.marketplace.config.OAuth2UserService;
import com.marketplace.config.SecurityConfig;
import com.marketplace.domain.Prompt;
import com.marketplace.domain.User;
import com.marketplace.domain.enums.PromptStatus;
import com.marketplace.domain.enums.PromptType;
import com.marketplace.domain.enums.TargetRole;
import com.marketplace.service.PromptService;
import com.marketplace.service.PurchaseService;
import com.marketplace.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.BDDMockito.given;
import static org.springframework.security.authentication.UsernamePasswordAuthenticationToken.authenticated;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PurchaseController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = {
        "spring.security.oauth2.client.registration.google.client-id=test-id",
        "spring.security.oauth2.client.registration.google.client-secret=test-secret",
        "cors.allowed-origins=http://localhost:3000"
})
class PurchaseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PurchaseService purchaseService;

    @MockBean
    private PromptService promptService;

    @MockBean
    private UserService userService;

    @MockBean
    private JwtProvider jwtProvider;

    @MockBean
    private OAuth2UserService oAuth2UserService;

    @MockBean
    private OAuth2SuccessHandler oAuth2SuccessHandler;

    @Test
    void getMe_withAuth_returns200WithUserInfo() throws Exception {
        Long userId = 1L;
        User mockUser = User.builder()
                .email("test@example.com")
                .name("Test User")
                .provider("google")
                .providerId("google-123")
                .build();

        given(userService.getById(userId)).willReturn(mockUser);

        mockMvc.perform(get("/api/users/me")
                        .with(authentication(authenticated(userId, null, List.of()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.name").value("Test User"));
    }

    @Test
    void getMe_withoutAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void myPrompts_withAuth_returns200WithPromptList() throws Exception {
        Long userId = 1L;
        Prompt mockPrompt = Prompt.builder()
                .sellerId(userId)
                .title("My Prompt")
                .description("Description")
                .content("content")
                .previewContent("preview...")
                .type(PromptType.AGENT)
                .targetRole(TargetRole.DEVELOPER)
                .price(0)
                .tags(List.of("tag1"))
                .status(PromptStatus.PUBLIC)
                .build();

        given(promptService.getMyPrompts(userId)).willReturn(List.of(mockPrompt));

        mockMvc.perform(get("/api/users/me/prompts")
                        .with(authentication(authenticated(userId, null, List.of()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].title").value("My Prompt"))
                .andExpect(jsonPath("$[0].type").value("AGENT"));
    }

    @Test
    void myPrompts_withoutAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/users/me/prompts"))
                .andExpect(status().isUnauthorized());
    }
}
