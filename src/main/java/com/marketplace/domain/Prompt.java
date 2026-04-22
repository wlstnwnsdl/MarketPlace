package com.marketplace.domain;

import com.marketplace.domain.enums.PromptStatus;
import com.marketplace.domain.enums.PromptType;
import com.marketplace.domain.enums.TargetRole;
import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "prompts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Prompt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long sellerId;

    @Size(max = 200)
    @Column(nullable = false)
    private String title;

    @Size(max = 2000)
    private String description;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(columnDefinition = "TEXT")
    private String previewContent;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PromptType type;

    @Enumerated(EnumType.STRING)
    private TargetRole targetRole;

    private int price = 0;

    private int downloadCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PromptStatus status = PromptStatus.PENDING;

    @ElementCollection
    @CollectionTable(name = "prompt_tags", joinColumns = @JoinColumn(name = "prompt_id"))
    @Column(name = "tag")
    private List<String> tags = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @Builder
    public Prompt(Long sellerId, String title, String description, String content,
                  String previewContent, PromptType type, TargetRole targetRole,
                  int price, List<String> tags, PromptStatus status) {
        this.sellerId = sellerId;
        this.title = title;
        this.description = description;
        this.content = content;
        this.previewContent = previewContent;
        this.type = type;
        this.targetRole = targetRole;
        this.price = price;
        if (tags != null) {
            this.tags = tags;
        }
        this.status = status != null ? status : PromptStatus.PENDING;
    }

    public void incrementDownloadCount() {
        this.downloadCount++;
    }

    public void update(String title, String description, String content,
                       String previewContent, PromptType type, TargetRole targetRole,
                       int price, List<String> tags, PromptStatus status) {
        this.title = title;
        this.description = description;
        this.content = content;
        this.previewContent = previewContent;
        this.type = type;
        this.targetRole = targetRole;
        this.price = price;
        this.tags = tags != null ? tags : new ArrayList<>();
        if (status != null) {
            this.status = status;
        }
    }
}
