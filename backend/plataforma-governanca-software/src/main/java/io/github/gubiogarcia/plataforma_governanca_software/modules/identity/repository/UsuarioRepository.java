package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {

    Optional<Usuario> findByExternalIdentityId(UUID externalIdentityId);
    Optional<Usuario> findByEmail(String email);
    List<Usuario> findAllByAtivo(Boolean ativo);
    boolean existsByEmail(String email);

    @Query("SELECT u FROM Usuario u WHERE LOWER(u.nome) LIKE LOWER(CONCAT('%', :nome, '%'))")
    List<Usuario> findByNomeContainingIgnoreCase(@Param("nome") String nome);
}