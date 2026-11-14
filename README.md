# Refúgio — sites para pousadas, PMS e atendimento comercial

Site principal: https://comandante22.github.io/pms-refugio/
Painel: https://aliceblue-skunk-932363.hostingersite.com/admin.php

## Plataforma

- Páginas próprias para sites, galeria, PMS, planos, como funciona, contato, personalização e contratação.
- Dez modelos completos: Brisa do Mar, Refúgio da Serra, Vila Solar, Casa de Campo, Jardim Secreto, Essência Boutique, Horizonte, Vila dos Encantos, Lua da Praia e Águas Claras.
- Personalização com nome, cidade, descrição, comodidades, acomodações, cores e fotos do visitante, salvas neste navegador durante o teste.
- Solicitação de reserva direta com datas, hóspedes e estimativa conforme os valores informados pelo visitante. Envio ao WhatsApp da hospedagem por ação do usuário. Não consulta calendário real nem confirma disponibilidade.
- Pedido de proposta registrado somente com autorização, seguido de resumo para a OUTS no WhatsApp. Não processa cobrança ou assinatura de contrato.
- Calendário PMS demonstrativo com reservas de teste persistidas localmente, validação de conflitos e indicação de limpeza.
- Títulos, descrições, URLs, canonical, sitemap e conteúdo em português. SEO não garante indexação ou posição no Google.

## Administração

Preços, planos, anúncios, identidade do site, modelos, orientações e perguntas/respostas da Bia, pedidos de clientes, revisões e restauração. Autenticação por sessão segura e CSRF. Senhas protegidas por hash; nenhuma senha ou chave de API neste repositório.

O login do proprietário foi ativado por pedido confirmado na conversa. Para futuras recuperações de acesso, usar um procedimento autenticado de administração da hospedagem; não criar usuário público automático.

## Bia

Rota ativa: `bia.php` no backend independente. O catálogo e as orientações são lidos das configurações publicadas. A Bia apresenta, qualifica, orienta a escolha e o teste, e oferece fechamento quando o visitante manifesta intenção de contratar ou pede atendimento humano.

O fluxo guiado e as perguntas/respostas do catálogo continuam disponíveis quando o provedor limita as respostas geradas; a interface identifica esse modo sem fingir geração de IA. Orientações do painel atualizam o contexto da assistente, não treinam os pesos do modelo. OmniRoute continua com sua própria disponibilidade e quota.

## Estrutura de publicação

Frontend estático em GitHub Pages e arquivos públicos na Hostinger. `backend/php/` contém as rotas e o painel; publicar seus arquivos na raiz do site PHP, junto dos arquivos estáticos.

Configurações, pedidos, sessões, histórico e a configuração OmniRoute ficam em `private/`, um nível acima de `public_html`. Preservar essa pasta em todas as atualizações. Não copiá-la para GitHub, backups públicos ou arquivos de distribuição. Publicações do Zelador não afetam mais a Bia.

O backend usa armazenamento JSON com escrita atômica e bloqueio para este painel de gestão inicial. Credenciais de IA já configuradas permanecem apenas no servidor. Arquivos enviados pelo administrador em `uploads/` devem ser preservados nas publicações.
