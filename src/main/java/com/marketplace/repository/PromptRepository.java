package com.marketplace.repository;

import com.marketplace.domain.Prompt;
import com.marketplace.domain.enums.PromptType;
import com.marketplace.domain.enums.TargetRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PromptRepository extends JpaRepository<Prompt, Long> {

    @Query("""
        SELECT p FROM Prompt p
        WHERE (:type IS NULL OR p.type = :type)
        AND (:targetRole IS NULL OR p.targetRole = :targetRole)
        AND (:keyword IS NULL OR p.title LIKE %:keyword% OR p.description LIKE %:keyword%)
        ORDER BY p.createdAt DESC
        """)
    Page<Prompt> findWithFilters(
        @Param("type") PromptType type,
        @Param("targetRole") TargetRole targetRole,
        @Param("keyword") String keyword,
        Pageable pageable
    );

    List<Prompt> findBySellerIdOrderByCreatedAtDesc(Long sellerId);
}
