package com.cloudinventory.security;

import java.util.Base64;
import java.util.List;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {

    @Value("${app.security.admin-username}")
    private String adminUsername;

    @Value("${app.security.admin-password}")
    private String adminPassword;

    @Value("${app.security.viewer-username}")
    private String viewerUsername;

    @Value("${app.security.viewer-password}")
    private String viewerPassword;

    @Value("${app.security.jwt-secret}")
    private String jwtSecret;

    // Password encoder used for the in-memory administrator and viewer accounts.
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Current project uses two configured accounts:
    // ADMIN  -> full modification privileges
    // VIEWER -> read-only privileges
    @Bean
    public UserDetailsService userDetailsService(
            PasswordEncoder passwordEncoder) {

        UserDetails admin = User
                .withUsername(adminUsername)
                .password(
                        passwordEncoder.encode(adminPassword)
                )
                .roles("ADMIN")
                .build();

        UserDetails viewer = User
                .withUsername(viewerUsername)
                .password(
                        passwordEncoder.encode(viewerPassword)
                )
                .roles("VIEWER")
                .build();

        return new InMemoryUserDetailsManager(
                admin,
                viewer
        );
    }

    // AuthenticationManager is used by AuthController
    // to verify username and password before generating a JWT.
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration)
            throws Exception {

        return configuration.getAuthenticationManager();
    }

    // Convert the configured Base64 JWT secret into an HMAC-SHA256 key.
    @Bean
    public SecretKey jwtSecretKey() {
        byte[] decodedSecret =
                Base64.getDecoder().decode(jwtSecret);

        return new SecretKeySpec(
                decodedSecret,
                "HmacSHA256"
        );
    }

    // JWT encoder used when the login endpoint creates a token.
    @Bean
    public JwtEncoder jwtEncoder(
            SecretKey secretKey) {

        return NimbusJwtEncoder
                .withSecretKey(secretKey)
                .build();
    }

    // JWT decoder used by Spring Security to validate
    // Authorization: Bearer <token> requests.
    @Bean
    public JwtDecoder jwtDecoder(
            SecretKey secretKey) {

        return NimbusJwtDecoder
                .withSecretKey(secretKey)
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
    }

    // Read the custom "role" claim from the JWT and convert it
    // into Spring Security authorities such as ROLE_ADMIN.
    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {

        JwtGrantedAuthoritiesConverter authoritiesConverter =
                new JwtGrantedAuthoritiesConverter();

        authoritiesConverter.setAuthoritiesClaimName("role");
        authoritiesConverter.setAuthorityPrefix("ROLE_");

        JwtAuthenticationConverter converter =
                new JwtAuthenticationConverter();

        converter.setJwtGrantedAuthoritiesConverter(
                authoritiesConverter
        );

        return converter;
    }

    // CORS configuration for local development.
    // AWS uses the same-origin Nginx proxy, so no separate
    // public frontend origin is required here.
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        configuration.setAllowedOrigins(
                List.of(
                        "http://localhost:5173",
                        "http://localhost:3000"
                )
        );

        configuration.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "DELETE",
                        "OPTIONS"
                )
        );

        configuration.setAllowedHeaders(
                List.of(
                        "Authorization",
                        "Content-Type"
                )
        );

        configuration.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );

        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationConverter jwtAuthenticationConverter)
            throws Exception {

        http
                // API uses JWT bearer tokens rather than server sessions.
                .csrf(csrf -> csrf.disable())

                .cors(cors ->
                        cors.configurationSource(
                                corsConfigurationSource()
                        )
                )

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(auth -> auth

                        // Login and health check are public.
                        .requestMatchers(
                                "/api/auth/login",
                                "/api/health",
                                "/api/health/**"
                        )
                        .permitAll()

                        // PUBLIC READ ACCESS
                        // Anyone can open the dashboard and view
                        // products, inventory and orders.
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/products/**",
                                "/api/inventory/**",
                                "/api/orders/**"
                        )
                        .permitAll()

                        // Administrator-only CREATE operations.
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/**"
                        )
                        .hasRole("ADMIN")

                        // Administrator-only UPDATE operations.
                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/**"
                        )
                        .hasRole("ADMIN")

                        // Administrator-only DELETE operations.
                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/**"
                        )
                        .hasRole("ADMIN")

                        // CORS preflight requests are public.
                        .requestMatchers(
                                HttpMethod.OPTIONS,
                                "/**"
                        )
                        .permitAll()

                        // Everything else requires authentication.
                        .anyRequest()
                        .authenticated()
                )

                // Validate JWT bearer tokens on protected requests.
                .oauth2ResourceServer(
                        oauth2 ->
                                oauth2.jwt(
                                        jwt ->
                                                jwt.jwtAuthenticationConverter(
                                                        jwtAuthenticationConverter
                                                )
                                )
                );

        return http.build();
    }
}