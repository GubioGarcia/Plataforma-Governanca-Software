package io.github.gubiogarcia.plataforma_governanca_software.support;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository.UsuarioRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain.Organizacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.repository.OrganizacaoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.StatusProjeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository.ProjetoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository.StatusProjetoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.TipoRequisito;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.domain.Requisito;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.domain.StatusRequisito;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.repository.RequisitoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.repository.StatusRequisitoRepository;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

/**
 * Monta no H2 o cenário padrão dos testes de integração da autorização:
 * usuários, uma organização com um projeto, status de requisito RASCUNHO/APROVADO/REPROVADO
 * e requisitos. Só dados — quem é quem vem dos grupos (AutenticacaoTeste).
 */
@Component
public class CenarioProjetoTeste {

    private final UsuarioRepository usuarioRepository;
    private final OrganizacaoRepository organizacaoRepository;
    private final ProjetoRepository projetoRepository;
    private final StatusProjetoRepository statusProjetoRepository;
    private final StatusRequisitoRepository statusRequisitoRepository;
    private final RequisitoRepository requisitoRepository;

    public CenarioProjetoTeste(UsuarioRepository usuarioRepository, OrganizacaoRepository organizacaoRepository,
                               ProjetoRepository projetoRepository, StatusProjetoRepository statusProjetoRepository,
                               StatusRequisitoRepository statusRequisitoRepository, RequisitoRepository requisitoRepository) {
        this.usuarioRepository = usuarioRepository;
        this.organizacaoRepository = organizacaoRepository;
        this.projetoRepository = projetoRepository;
        this.statusProjetoRepository = statusProjetoRepository;
        this.statusRequisitoRepository = statusRequisitoRepository;
        this.requisitoRepository = requisitoRepository;
    }

    public Usuario usuario(String email) {
        return usuarioRepository.save(Usuario.builder().externalIdentityId(UUID.randomUUID()).nome(email).email(email)
                .ativo(true).dataCriacao(Instant.now()).dataAtualizacao(Instant.now()).build());
    }

    public Organizacao organizacao(String nome, Usuario criador) {
        return organizacaoRepository.save(Organizacao.builder().nome(nome).ativo(true).criadoPor(criador.getId())
                .dataCriacao(Instant.now()).dataAtualizacao(Instant.now()).build());
    }

    public Projeto projeto(String nome, Organizacao org, Usuario criador) {
        StatusProjeto sp = statusProjetoRepository.findByNomeIgnoreCase("RASCUNHO").orElseGet(() ->
                statusProjetoRepository.save(StatusProjeto.builder().nome("RASCUNHO").descricao("x").ordem(1).build()));
        return projetoRepository.save(Projeto.builder().nome(nome).organizacao(org).status(sp).criadoPor(criador)
                .ativo(true).dataCriacao(Instant.now()).dataAtualizacao(Instant.now()).build());
    }

    public StatusRequisito statusRequisito(String nome, int ordem) {
        return statusRequisitoRepository.findByNomeIgnoreCase(nome).orElseGet(() ->
                statusRequisitoRepository.save(StatusRequisito.builder().nome(nome).descricao(nome).ordem(ordem).build()));
    }

    /** Garante RASCUNHO (ordem 1, inicial), APROVADO e REPROVADO. */
    public void statusDeRequisito() {
        statusRequisito("RASCUNHO", 1);
        statusRequisito("APROVADO", 3);
        statusRequisito("REPROVADO", 4);
    }

    public Requisito requisito(Projeto projeto, Usuario criador, String statusNome) {
        long seq = requisitoRepository.findMaxSequencialByProjetoId(projeto.getId()) + 1;
        return requisitoRepository.save(Requisito.builder()
                .projeto(projeto)
                .codigo(String.format("REQ-%03d", seq))
                .titulo("Requisito " + seq)
                .descricao("d")
                .tipoRequisito(TipoRequisito.FUNCIONAL)
                .status(statusRequisito(statusNome, statusNome.equals("RASCUNHO") ? 1 : 3))
                .versao(1)
                .criadoPor(criador)
                .ativo(true)
                .dataCriacao(Instant.now())
                .dataAtualizacao(Instant.now())
                .build());
    }

    public static String grupoOrg(Organizacao org, String sub) {
        return "/org-" + org.getId() + "/" + sub;
    }

    public static String grupoProj(Projeto p, String sub) {
        return "/org-" + p.getOrganizacao().getId() + "/proj-" + p.getId() + "/" + sub;
    }
}
