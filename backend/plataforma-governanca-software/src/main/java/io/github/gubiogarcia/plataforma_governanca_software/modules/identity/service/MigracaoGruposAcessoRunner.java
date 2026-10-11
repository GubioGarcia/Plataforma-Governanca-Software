package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository.UsuarioRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain.Organizacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.repository.OrganizacaoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository.ProjetoRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.UUID;

/**
 * Na inicialização, cria os grupos de acesso das organizações e projetos que ainda
 * não têm (dados anteriores ao controle de autorização). O criador de cada um entra
 * no _dono. Idempotente: só processa registros com keycloak_group_id nulo.
 *
 * Cada registro roda na própria transação; uma falha (ex.: Keycloak fora do ar) é
 * registrada no log e o restante segue — a próxima inicialização tenta de novo.
 * Desligável com plataforma.grupos-acesso.migrar-na-inicializacao=false.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "plataforma.grupos-acesso.migrar-na-inicializacao", havingValue = "true", matchIfMissing = true)
public class MigracaoGruposAcessoRunner implements ApplicationRunner {

    private final OrganizacaoRepository organizacaoRepository;
    private final ProjetoRepository projetoRepository;
    private final UsuarioRepository usuarioRepository;
    private final GruposAcessoService gruposAcessoService;
    private final TransactionTemplate transactionTemplate;

    public MigracaoGruposAcessoRunner(OrganizacaoRepository organizacaoRepository,
                                      ProjetoRepository projetoRepository,
                                      UsuarioRepository usuarioRepository,
                                      GruposAcessoService gruposAcessoService,
                                      PlatformTransactionManager transactionManager) {
        this.organizacaoRepository = organizacaoRepository;
        this.projetoRepository     = projetoRepository;
        this.usuarioRepository     = usuarioRepository;
        this.gruposAcessoService   = gruposAcessoService;
        this.transactionTemplate   = new TransactionTemplate(transactionManager);
    }

    @Override
    public void run(ApplicationArguments args) {
        // Organizações primeiro: o grupo do projeto é criado dentro do grupo da organização
        var organizacoes = organizacaoRepository.findAllByKeycloakGroupIdIsNull().stream().map(Organizacao::getId).toList();
        var projetos     = projetoRepository.findAllByKeycloakGroupIdIsNull().stream().map(Projeto::getId).toList();

        if (organizacoes.isEmpty() && projetos.isEmpty()) {
            return;
        }
        log.info("Migração de grupos de acesso: {} organização(ões) e {} projeto(s) sem grupo no Keycloak.",
                organizacoes.size(), projetos.size());

        int falhas = 0;
        for (UUID id : organizacoes) {
            falhas += executar("organização", id, () -> {
                Organizacao organizacao = organizacaoRepository.findById(id).orElseThrow();
                Usuario criador = organizacao.getCriadoPor() != null
                        ? usuarioRepository.findById(organizacao.getCriadoPor()).orElse(null)
                        : null;
                organizacao.setKeycloakGroupId(gruposAcessoService.criarEstruturaOrganizacao(organizacao, criador));
            });
        }
        for (UUID id : projetos) {
            falhas += executar("projeto", id, () -> {
                Projeto projeto = projetoRepository.findById(id).orElseThrow();
                projeto.setKeycloakGroupId(gruposAcessoService.criarEstruturaProjeto(projeto, projeto.getCriadoPor()));
            });
        }

        if (falhas == 0) {
            log.info("Migração de grupos de acesso concluída.");
        } else {
            log.error("Migração de grupos de acesso concluída com {} falha(s); será tentada de novo na próxima inicialização.", falhas);
        }
    }

    /** Executa um item na própria transação. Devolve 1 em caso de falha, 0 em caso de sucesso. */
    private int executar(String tipo, UUID id, Runnable acao) {
        try {
            transactionTemplate.executeWithoutResult(status -> acao.run());
            log.info("Grupos de acesso criados para {} {}.", tipo, id);
            return 0;
        } catch (RuntimeException ex) {
            log.error("Falha ao criar grupos de acesso para {} {}: {}", tipo, id, ex.getMessage());
            return 1;
        }
    }
}
