package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.dto;

/**
 * Resposta de login e de renovação de sessão. O refresh token NÃO vem aqui: vai num
 * cookie HttpOnly (inacessível ao JavaScript). expiresIn = validade do token em segundos.
 */
public record LoginResponseDTO(
        String token,
        long expiresIn,
        UsuarioResponseDTO user
) {}
