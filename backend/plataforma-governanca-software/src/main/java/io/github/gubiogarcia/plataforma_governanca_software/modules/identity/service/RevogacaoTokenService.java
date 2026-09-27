package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Marca de revogação de tokens (Passo 3.1 do doc de autorização).
 *
 * O access token é um JWT validado localmente, então mudar os grupos de alguém no
 * Keycloak não altera o token que ele já tem. Ao mudar os grupos, o backend grava
 * "tokens emitidos antes de agora não valem mais"; a próxima requisição recebe 401,
 * o front renova a sessão pelo refresh token e o token novo já vem com os grupos certos.
 *
 * A consulta roda em toda requisição autenticada, por isso fica em cache em memória
 * (atualizado aqui mesmo na escrita). Com mais de uma instância do backend o cache
 * precisaria ser compartilhado.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RevogacaoTokenService {

    private final UsuarioRepository usuarioRepository;

    /** keycloakId → marca (vazio = nunca revogado). */
    private final Map<UUID, Optional<Instant>> cache = new ConcurrentHashMap<>();

    /**
     * Revoga os tokens atuais do usuário. A marca é truncada em segundos porque o
     * "iat" do JWT tem precisão de segundos (fica uma janela de no máximo 1 s).
     */
    @Transactional
    public void revogarTokensDoUsuario(Usuario usuario) {
        if (usuario == null || usuario.getExternalIdentityId() == null) {
            return;
        }
        Instant marca = Instant.now().truncatedTo(ChronoUnit.SECONDS);
        usuario.setTokensRevogadosAntesDe(marca);
        usuarioRepository.save(usuario);
        cache.put(usuario.getExternalIdentityId(), Optional.of(marca));
        log.info("Tokens do usuário {} revogados (emitidos antes de {}).", usuario.getId(), marca);
    }

    public Optional<Instant> revogadoAntesDe(UUID keycloakId) {
        return cache.computeIfAbsent(keycloakId, id ->
                usuarioRepository.findByExternalIdentityId(id).map(Usuario::getTokensRevogadosAntesDe));
    }

    /**
     * true se o token (pelo "iat") pode ter sido emitido antes da marca de revogação.
     * O "iat" só tem precisão de segundos: um token do MESMO segundo da marca é ambíguo
     * e é recusado (senão um token antigo, sem o grupo novo, passaria e daria 403).
     * O AuthService garante que o token entregue no login/refresh já é do segundo seguinte.
     */
    public boolean tokenRevogado(UUID keycloakId, Instant emitidoEm) {
        if (emitidoEm == null) {
            return false;
        }
        return revogadoAntesDe(keycloakId).map(marca -> !emitidoEm.isAfter(marca)).orElse(false);
    }
}
