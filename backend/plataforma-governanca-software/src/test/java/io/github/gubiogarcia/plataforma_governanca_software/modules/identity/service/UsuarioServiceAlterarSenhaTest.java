package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.dto.AlterarSenhaRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.infra.KeycloakAdminClient;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.infra.KeycloakTokenClient;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Troca de senha: o usuário vem do token (não mais de um e-mail no corpo)
 * e a senha atual é conferida no Keycloak antes de redefinir.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("test")
@Transactional
class UsuarioServiceAlterarSenhaTest {

    private static final String EMAIL = "senha-teste@exemplo.com";

    @Autowired private UsuarioService usuarioService;
    @Autowired private UsuarioRepository usuarioRepository;

    @MockitoBean private JwtDecoder jwtDecoder;
    @MockitoBean private KeycloakAdminClient keycloakAdminClient;
    @MockitoBean private KeycloakTokenClient keycloakTokenClient;

    private UUID keycloakId;
    private Jwt jwtMock;

    @BeforeEach
    void setUp() {
        keycloakId = UUID.randomUUID();

        usuarioRepository.save(Usuario.builder()
                .externalIdentityId(keycloakId)
                .nome("Usuário Senha Teste")
                .email(EMAIL)
                .ativo(true)
                .dataCriacao(Instant.now())
                .dataAtualizacao(Instant.now())
                .build());

        jwtMock = mock(Jwt.class);
        when(jwtMock.getSubject()).thenReturn(keycloakId.toString());
    }

    @Test
    void alterarSenha_deveRedefinirNoKeycloak_quandoSenhaAtualCorreta() {
        when(keycloakTokenClient.credenciaisValidas(EMAIL, "senhaAtual123")).thenReturn(true);

        usuarioService.alterarSenha(jwtMock,
                new AlterarSenhaRequestDTO("senhaAtual123", "novaSenha123", "novaSenha123"));

        verify(keycloakAdminClient).redefinirSenha(keycloakId, "novaSenha123");
    }

    @Test
    void alterarSenha_deveLancarExcecao_eNaoRedefinir_quandoSenhaAtualIncorreta() {
        when(keycloakTokenClient.credenciaisValidas(EMAIL, "senhaErrada")).thenReturn(false);

        assertThatThrownBy(() -> usuarioService.alterarSenha(jwtMock,
                new AlterarSenhaRequestDTO("senhaErrada", "novaSenha123", "novaSenha123")))
                .isInstanceOf(UsuarioService.SenhaAtualInvalidaException.class);

        verify(keycloakAdminClient, never()).redefinirSenha(any(), anyString());
    }

    @Test
    void alterarSenha_deveLancarExcecao_quandoConfirmacaoNaoConfere() {
        assertThatThrownBy(() -> usuarioService.alterarSenha(jwtMock,
                new AlterarSenhaRequestDTO("senhaAtual123", "novaSenha123", "outraSenha123")))
                .isInstanceOf(UsuarioService.SenhasNaoConferemException.class);

        verifyNoInteractions(keycloakTokenClient, keycloakAdminClient);
    }

    @Test
    void alterarSenha_deveLancarExcecao_quandoNovaSenhaIgualAtual() {
        assertThatThrownBy(() -> usuarioService.alterarSenha(jwtMock,
                new AlterarSenhaRequestDTO("mesmaSenha123", "mesmaSenha123", "mesmaSenha123")))
                .isInstanceOf(UsuarioService.SenhasNaoConferemException.class);

        verifyNoInteractions(keycloakTokenClient, keycloakAdminClient);
    }

    @Test
    void alterarSenha_deveLancarExcecao_quandoUsuarioDoTokenNaoExiste() {
        Jwt jwtDesconhecido = mock(Jwt.class);
        when(jwtDesconhecido.getSubject()).thenReturn(UUID.randomUUID().toString());

        assertThatThrownBy(() -> usuarioService.alterarSenha(jwtDesconhecido,
                new AlterarSenhaRequestDTO("senhaAtual123", "novaSenha123", "novaSenha123")))
                .isInstanceOf(UsuarioService.UsuarioNaoEncontradoException.class);

        verifyNoInteractions(keycloakTokenClient, keycloakAdminClient);
    }
}
