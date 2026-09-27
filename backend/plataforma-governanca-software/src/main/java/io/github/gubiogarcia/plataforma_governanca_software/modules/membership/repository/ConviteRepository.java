package io.github.gubiogarcia.plataforma_governanca_software.modules.membership.repository;

import io.github.gubiogarcia.plataforma_governanca_software.modules.membership.domain.Convite;
import io.github.gubiogarcia.plataforma_governanca_software.modules.membership.domain.StatusConvite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ConviteRepository extends JpaRepository<Convite, UUID> {

    List<Convite> findAllByEmailIgnoreCaseAndStatusOrderByDataCriacaoDesc(String email, StatusConvite status);

    List<Convite> findAllByOrganizacaoIdAndProjetoIsNullAndStatusOrderByDataCriacaoDesc(UUID organizacaoId, StatusConvite status);

    List<Convite> findAllByProjetoIdAndStatusOrderByDataCriacaoDesc(UUID projetoId, StatusConvite status);

    boolean existsByEmailIgnoreCaseAndOrganizacaoIdAndProjetoIsNullAndStatus(String email, UUID organizacaoId, StatusConvite status);

    boolean existsByEmailIgnoreCaseAndProjetoIdAndStatus(String email, UUID projetoId, StatusConvite status);
}
