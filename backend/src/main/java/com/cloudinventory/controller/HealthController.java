package com.cloudinventory.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HealthController {

    @GetMapping("/")
    public Map<String, String> home() {
        return Map.of(
                "application", "CloudInventory",
                "status", "running"
        );
    }

    @GetMapping("/api/health")
    public Map<String, String> health() {
        return Map.of(
                "application", "CloudInventory Backend",
                "status", "UP"
        );
    }
}