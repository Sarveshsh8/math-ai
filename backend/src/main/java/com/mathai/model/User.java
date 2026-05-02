package com.mathai.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.Instant;

@Document(collection = "users")
public class User {

    @Id
    private String id;

    @Indexed(unique = true)
    private String email;

    private String passwordHash;

    private String displayName;

    @CreatedDate
    private Instant createdAt;

    private Instant trialEndsAt;
    private boolean subscribed = false;
    private String stripeCustomerId;

    public User() {}

    public User(String email, String passwordHash, String displayName) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.displayName = displayName;
        this.trialEndsAt = Instant.now().plus(java.time.Duration.ofDays(7));
    }

    public String getId() { return id; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public String getDisplayName() { return displayName; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getTrialEndsAt() { return trialEndsAt; }
    public boolean isSubscribed() { return subscribed; }
    public String getStripeCustomerId() { return stripeCustomerId; }

    public void setId(String id) { this.id = id; }
    public void setEmail(String email) { this.email = email; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public void setTrialEndsAt(Instant trialEndsAt) { this.trialEndsAt = trialEndsAt; }
    public void setSubscribed(boolean subscribed) { this.subscribed = subscribed; }
    public void setStripeCustomerId(String stripeCustomerId) { this.stripeCustomerId = stripeCustomerId; }

    public boolean hasAccess() {
        if (subscribed) return true;
        return trialEndsAt != null && Instant.now().isBefore(trialEndsAt);
    }
}
