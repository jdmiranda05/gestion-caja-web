
package pe.edu.pe.gestion_caja_web.user;

import java.time.Duration;
import java.time.Instant;
import java.util.Base64;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Service;

import com.nimbusds.jose.jwk.source.ImmutableSecret;

/**
 * Genera y configura la validacion de tokens JWT.
 */
@Service
public class JwtService {

    private final JwtEncoder jwtEncoder;
    private final Duration expiration;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-minutes}") long expirationMinutes) {

        byte[] keyBytes = Base64.getDecoder().decode(secret);

        if (keyBytes.length < 32) {
            throw new IllegalArgumentException(
                    "La clave JWT debe tener al menos 256 bits."
            );
        }

        SecretKey key = new SecretKeySpec(keyBytes, "HmacSHA256");

        this.jwtEncoder = new NimbusJwtEncoder(
                new ImmutableSecret<>(key)
        );

        this.expiration = Duration.ofMinutes(expirationMinutes);
    }

    /**
     * Genera un JWT para el usuario autenticado.
     */
    public String generateToken(String username, Role role) {
        Instant now = Instant.now();

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .subject(username)
                .issuedAt(now)
                .expiresAt(now.plus(expiration))
                .claim("role", role.name())
                .build();

        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();

        return jwtEncoder.encode(
                JwtEncoderParameters.from(header, claims)
        ).getTokenValue();
    }

    /**
     * Configura el decodificador que validara los JWT recibidos.
     */
    @Bean
    public JwtDecoder jwtDecoder(UserRepository userRepository,
            @Value("${app.jwt.secret}") String secret) {

        byte[] keyBytes = Base64.getDecoder().decode(secret);

        SecretKey key = new SecretKeySpec(keyBytes, "HmacSHA256");

        NimbusJwtDecoder decoder = NimbusJwtDecoder
                .withSecretKey(key)
                .macAlgorithm(MacAlgorithm.HS256)
                .build();

        decoder.setJwtValidator(
                new org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator<>(
                        JwtValidators.createDefault(),
                        jwt -> {
                            String username = jwt.getSubject();

                            if (username == null || username.isBlank()) {
                                return org.springframework.security.oauth2.core.OAuth2TokenValidatorResult.failure(
                                        new org.springframework.security.oauth2.core.OAuth2Error(
                                                "invalid_token",
                                                "El token no identifica a un usuario.",
                                                null
                                        )
                                );
                            }

                            User user = userRepository.findByUsername(username)
                                    .orElse(null);

                            if (user == null || !user.isActive()
                                    || !user.getRole().name().equals(
                                            jwt.getClaimAsString("role"))) {

                                return org.springframework.security.oauth2.core.OAuth2TokenValidatorResult.failure(
                                        new org.springframework.security.oauth2.core.OAuth2Error(
                                                "invalid_token",
                                                "La cuenta esta desactivada o sus permisos cambiaron.",
                                                null
                                        )
                                );
                            }

                            return org.springframework.security.oauth2.core.OAuth2TokenValidatorResult.success();
                        }
                )
        );

        return decoder;
    }
}
