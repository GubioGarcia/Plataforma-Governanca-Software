package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {
    Optional<Usuario> findByExternalIdentityId(UUID externalIdentityId);
    Optional<Usuario> findByEmail(String email);
    boolean existsByEmail(String email);
}
