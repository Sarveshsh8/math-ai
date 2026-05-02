package com.mathai.controller;

import com.mathai.service.BillingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/billing")
public class BillingController {

    private final BillingService billingService;

    public BillingController(BillingService billingService) {
        this.billingService = billingService;
    }

    @PostMapping("/checkout")
    public ResponseEntity<Map<String, String>> checkout(Authentication auth) throws Exception {
        String userId = (String) auth.getCredentials();
        String url = billingService.createCheckoutSession(userId);
        return ResponseEntity.ok(Map.of("url", url));
    }

    @PostMapping("/webhook")
    public ResponseEntity<Void> webhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) throws Exception {
        billingService.handleWebhook(payload, sigHeader);
        return ResponseEntity.ok().build();
    }
}
