# Backend da plataforma Refúgio

A versão atual é a plataforma comercial com painel administrativo. O código executado fica em backend/php/; copiar seus arquivos para a raiz pública da Hostinger junto do frontend e assets.

Atendimento novo: bia.php. Configuração e catálogo públicos: content.php. Administração: admin.php e admin-api.php. Pedidos: lead.php.

A pasta private, um nível acima de public_html, guarda credenciais, sessões, configurações publicadas, histórico e pedidos. Nunca publicá-la no GitHub. Preservar também uploads/ nas atualizações.

Os módulos .mjs e api.php são compatibilidade da integração anterior. A Bia atual não depende do Zelador. As regras comerciais e preços vêm do painel. O atendimento guiado e a geração por IA são identificados de forma transparente.

O painel foi ativado para o proprietário mediante confirmação do pedido de acesso. Não há senha padrão. Não remover os controles de aprovação, sessão ou CSRF.
