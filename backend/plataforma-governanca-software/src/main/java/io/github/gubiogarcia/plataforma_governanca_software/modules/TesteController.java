package io.github.gubiogarcia.plataforma_governanca_software.modules;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/teste")
public class TesteController {
    @GetMapping
    public String hello() {
        return "Swagger funcionando!";
    }
}
