# Bia Refúgio — backend independente

Site: https://comandante22.github.io/pms-refugio/
Endpoint ativo: https://aliceblue-skunk-932363.hostingersite.com/api.php
Saúde: https://aliceblue-skunk-932363.hostingersite.com/health.php

A rota antiga /api/refugio no domínio do Zelador deixou de existir quando outra versão desse aplicativo foi publicada. O frontend foi atualizado para um serviço PHP separado na Hostinger. Atualizações do Zelador não precisam conter a Bia e não afetam mais seu backend.

## Arquivos

public/api.php: CORS, validação, limites, histórico enviado por conversa, chamada OmniRoute e respostas do catálogo identificadas quando o provedor falha.
public/catalogo.json: conteúdo comercial público e instruções da assistente. Sem segredos.
public/health.php: somente status booleano de configuração; nunca revela chave/modelo.
public/index.html: link para o site principal.

Configuração privada no servidor: um nível acima de public_html, em private/bia-config.json (diretório700, arquivo600). O arquivo contém apenas as variáveis OmniRoute necessárias, copiadas internamente do servidor já configurado, sem exibir valores e sem modificar o ambiente do Zelador. NÃO copiar este arquivo para GitHub ou public_html.

A página reconhece respostas do catálogo (provider=catalogo) e mostra aviso explícito. Saudação curta responde sem gastar quota (provider=acolhimento). Texto livre usa OmniRoute quando disponível (provider=omniroute). Respostas de catálogo não fingem ser geração da IA. Criação de rascunhos continua exigindo IA disponível e mostra erro caso a quota esteja bloqueada.

Timeout do atendimento: 25 segundos; gerador: 60 segundos. Em falha/429, intervalo de recuperação de 120 segundos antes de nova tentativa ao provedor. Sem conversas armazenadas no servidor. Contador de requisições usa hash do IP e janela de dez minutos, em arquivo privado.

Para atualizar: enviar apenas a pasta public para o domínio do backend via TUS. Preservar a pasta private; não precisa de build Node, cron contínuo nem reinício. Scripts temporários de transferência foram removidos e o cron de manutenção apagado.

Contato comercial: OUTS Estúdio Web, WhatsApp (24)99853-3753, https://wa.me/5524998533753.

Os arquivos .mjs nesta pasta são da integração anterior e não são mais usados no servidor ativo. Não reinstale a rota da Bia no Zelador; a versão ativa está em php/.
