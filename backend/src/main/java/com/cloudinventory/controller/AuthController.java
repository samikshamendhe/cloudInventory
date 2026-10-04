package com.cloudinventory.controller;

import com.cloudinventory.security.JwtService;

import org.springframework.http.ResponseEntity;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import org.springframework.security.core.Authentication;

import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:3000"
})
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthController(
            AuthenticationManager authenticationManager,
            JwtService jwtService) {

        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest request) {

        try {

            Authentication authentication =
                    authenticationManager.authenticate(
                            new UsernamePasswordAuthenticationToken(
                                    request.username(),
                                    request.password()
                            )
                    );

            String token =
                    jwtService.generateToken(authentication);

            String role =
                    authentication
                            .getAuthorities()
                            .iterator()
                            .next()
                            .getAuthority()
                            .replace("ROLE_", "");

            return ResponseEntity.ok(
                    Map.of(
                            "token", token,
                            "username", authentication.getName(),
                            "role", role
                    )
            );

        } catch (Exception e) {

            return ResponseEntity
                    .status(401)
                    .body(
                            Map.of(
                                    "message",
                                    "Invalid username or password"
                            )
                    );
        }
    }

    public record LoginRequest(
            String username,
            String password
    ) {
    }
}