package com.mathai.service;

import com.mathai.model.User;
import com.mathai.repository.UserRepository;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Customer;
import com.stripe.model.Event;
import com.stripe.model.Subscription;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.CustomerCreateParams;
import com.stripe.param.checkout.SessionCreateParams;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

@Service
public class BillingService {

    @Value("${stripe.secret-key}")
    private String secretKey;

    @Value("${stripe.webhook-secret}")
    private String webhookSecret;

    @Value("${stripe.price-id}")
    private String priceId;

    @Value("${stripe.success-url}")
    private String successUrl;

    @Value("${stripe.cancel-url}")
    private String cancelUrl;

    private final UserRepository userRepository;

    public BillingService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostConstruct
    public void init() {
        Stripe.apiKey = secretKey;
    }

    public String createCheckoutSession(String userId) throws Exception {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        String customerId = user.getStripeCustomerId();
        if (customerId == null) {
            Customer customer = Customer.create(
                CustomerCreateParams.builder()
                    .setEmail(user.getEmail())
                    .setName(user.getDisplayName())
                    .build()
            );
            customerId = customer.getId();
            user.setStripeCustomerId(customerId);
            userRepository.save(user);
        }

        Session session = Session.create(
            SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
                .setCustomer(customerId)
                .addLineItem(
                    SessionCreateParams.LineItem.builder()
                        .setPrice(priceId)
                        .setQuantity(1L)
                        .build()
                )
                .setSuccessUrl(successUrl)
                .setCancelUrl(cancelUrl)
                .putMetadata("userId", userId)
                .build()
        );

        return session.getUrl();
    }

    public void handleWebhook(String payload, String sigHeader) throws Exception {
        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (SignatureVerificationException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid signature");
        }

        switch (event.getType()) {
            case "checkout.session.completed" -> {
                Session session = (Session) event.getDataObjectDeserializer()
                    .getObject().orElseThrow();
                String userId = session.getMetadata().get("userId");
                activateSubscription(userId);
            }
            case "customer.subscription.deleted" -> {
                Subscription sub = (Subscription) event.getDataObjectDeserializer()
                    .getObject().orElseThrow();
                String customerId = sub.getCustomer();
                deactivateByCustomer(customerId);
            }
        }
    }

    private void activateSubscription(String userId) {
        Optional<User> opt = userRepository.findById(userId);
        opt.ifPresent(u -> {
            u.setSubscribed(true);
            userRepository.save(u);
        });
    }

    private void deactivateByCustomer(String customerId) {
        userRepository.findByStripeCustomerId(customerId).ifPresent(u -> {
            u.setSubscribed(false);
            userRepository.save(u);
        });
    }
}
