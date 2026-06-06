package io.github.gubiogarcia.plataforma_governanca_software.modules.product.repository;

import io.github.gubiogarcia.plataforma_governanca_software.modules.product.domain.VisaoProduto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface VisaoProdutoRepository extends JpaRepository<VisaoProduto, UUID> {
    Optional<VisaoProduto> findByProjetoId(UUID projetoId);
    boolean existsByProjetoId(UUID projetoId);
}