package com.marketplace.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "purchases",
    uniqueConstraints = @UniqueConstraint(columnNames = {"buyer_id", "prompt_id"})
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Purchase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "buyer_id", nullable = false)
    private Long buyerId;

    @Column(name = "prompt_id", nullable = false)
    private Long promptId;

    @CreationTimestamp
    private LocalDateTime purchasedAt;

    @Builder
    public Purchase(Long buyerId, Long promptId) {
        this.buyerId = buyerId;
        this.promptId = promptId;
    }
}
