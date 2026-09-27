package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.service;

import io.github.gubiogarcia.plataforma_governanca_software.config.RevogacaoTokenValidator;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/** Marca de revogação (Passo 3.1): regra "iat <= marca" e cache. */
class RevogacaoTokenServiceTest {

    private UsuarioRepository repo;
    private RevogacaoTokenService service;
    private Usuario usuario;

    @BeforeEach
    void setUp() {
        repo = mock(UsuarioRepository.class);
        service = new RevogacaoTokenService(repo);
        usuario = Usuario.builder().id(UUID.randomUUID()).externalIdentityId(UUID.randomUUID()).build();
    }

    @Test
    void semMarca_nenhumTokenERevogado() {
        when(repo.findByExternalIdentityId(usuario.getExternalIdentityId())).thenReturn(Optional.of(usuario));

        assertThat(service.tokenRevogado(usuario.getExternalIdentityId(), Instant.now())).isFalse();
    }

    @Test
    void revogar_gravaMarcaTruncadaEmSegundos() {
        service.revogarTokensDoUsuario(usuario);

        verify(repo).save(usuario);
        assertThat(usuario.getTokensRevogadosAntesDe()).isNotNull();
        assertThat(usuario.getTokensRevogadosAntesDe().getNano()).isZero();
    }

    @Test
    void tokenAnteriorOuDoMesmoSegundoDaMarca_eRevogado_posteriorNao() {
        service.revogarTokensDoUsuario(usuario);
        Instant marca = usuario.getTokensRevogadosAntesDe();

        assertThat(service.tokenRevogado(usuario.getExternalIdentityId(), marca.minusSeconds(5))).isTrue();
        // Mesmo segundo: ambíguo ("iat" em segundos) → recusado, senão token antigo passaria sem o grupo novo
        assertThat(service.tokenRevogado(usuario.getExternalIdentityId(), marca)).isTrue();
        assertThat(service.tokenRevogado(usuario.getExternalIdentityId(), marca.plusSeconds(1))).isFalse();
    }

    @Test
    void consultaUsaCache_depoisDaPrimeiraLeitura() {
        when(repo.findByExternalIdentityId(usuario.getExternalIdentityId())).thenReturn(Optional.of(usuario));

        service.tokenRevogado(usuario.getExternalIdentityId(), Instant.now());
        service.tokenRevogado(usuario.getExternalIdentityId(), Instant.now());

        verify(repo, times(1)).findByExternalIdentityId(usuario.getExternalIdentityId());
    }

    @Test
    void revogar_atualizaOCache_semNovaLeitura() {
        when(repo.findByExternalIdentityId(usuario.getExternalIdentityId())).thenReturn(Optional.of(usuario));
        Instant antes = Instant.now().minus(10, ChronoUnit.SECONDS);
        assertThat(service.tokenRevogado(usuario.getExternalIdentityId(), antes)).isFalse();

        service.revogarTokensDoUsuario(usuario);

        assertThat(service.tokenRevogado(usuario.getExternalIdentityId(), antes)).isTrue();
        verify(repo, times(1)).findByExternalIdentityId(any());
    }

    @Test
    void tokenSemIat_naoERevogado_eUsuarioSemContaNaoEMarcado() {
        assertThat(service.tokenRevogado(usuario.getExternalIdentityId(), null)).isFalse();

        service.revogarTokensDoUsuario(Usuario.builder().id(UUID.randomUUID()).build());
        verify(repo, never()).save(any());
    }

    @Test
    void validador_recusaTokenRevogado_comDescricaoReconhecivel() {
        service.revogarTokensDoUsuario(usuario);
        RevogacaoTokenValidator validador = new RevogacaoTokenValidator(service);

        Jwt antigo = Jwt.withTokenValue("t").header("alg", "none")
                .subject(usuario.getExternalIdentityId().toString())
                .issuedAt(usuario.getTokensRevogadosAntesDe().minusSeconds(60))
                .build();
        Jwt novo = Jwt.withTokenValue("t").header("alg", "none")
                .subject(usuario.getExternalIdentityId().toString())
                .issuedAt(usuario.getTokensRevogadosAntesDe().plusSeconds(1))
                .build();

        var falha = validador.validate(antigo);
        assertThat(falha.hasErrors()).isTrue();
        assertThat(falha.getErrors()).anyMatch(e ->
                RevogacaoTokenValidator.DESCRICAO_TOKEN_REVOGADO.equals(e.getDescription()));
        assertThat(validador.validate(novo).hasErrors()).isFalse();
    }
}
