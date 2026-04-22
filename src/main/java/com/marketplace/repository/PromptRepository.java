package com.marketplace.repository;

import com.marketplace.domain.Prompt;
import com.marketplace.domain.enums.PromptStatus;
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
        AND (:status IS NULL OR p.status = :status)
        AND (:keyword IS NULL
             OR p.title LIKE %:keyword%
             OR p.description LIKE %:keyword%
             OR EXISTS (SELECT t FROM Prompt p2 JOIN p2.tags t WHERE p2 = p AND t LIKE %:keyword%))
        ORDER BY p.createdAt DESC
        """)
    Page<Prompt> findWithFilters(
        @Param("type") PromptType type,
        @Param("targetRole") TargetRole targetRole,
        @Param("status") PromptStatus status,
        @Param("keyword") String keyword,
        Pageable pageable
    );

    List<Prompt> findBySellerIdOrderByCreatedAtDesc(Long sellerId);
}
