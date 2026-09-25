package com.banfico.banking.repository;

import com.banfico.banking.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    @Query("select n from Notification n where n.recipient = :recipient or (n.recipientRole = :role and n.recipient = '*') order by n.createdAt desc")
    List<Notification> findForRecipient(@Param("recipient") String recipient, @Param("role") String role);

    @Query("select count(n) from Notification n where n.read = false and (n.recipient = :recipient or (n.recipientRole = :role and n.recipient = '*'))")
    long countUnreadForRecipient(@Param("recipient") String recipient, @Param("role") String role);
}
