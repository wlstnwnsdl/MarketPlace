package com.marketplace.api;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {

    @GetMapping(value = {"/{path:[^\\.]*}", "/{path:^(?!api|oauth2|login).*$}/**"})
    public String forward() {
        return "forward:/index.html";
    }
}
