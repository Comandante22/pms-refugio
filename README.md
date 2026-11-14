# Refúgio — PMS, sites e Bia

Site: https://comandante22.github.io/pms-refugio/

A Bia consulta o OmniRoute por um backend HTTPS. A chave fica apenas no servidor. Visitantes não precisam colar uma chave de API.

## Funcionalidades

- Atendimento sobre PMS, criação de sites, planos e condições comerciais divulgadas.
- Histórico de cada conversa durante a página aberta; botão Nova conversa limpa esse contexto.
- Criação de rascunho de conteúdo com IA a partir de nome da pousada e cidade.
- Layout responsivo e carrossel de imagens.

O calendário tem dados ilustrativos. O rascunho não publica sites nem ativa pagamentos; cadastro de hospedagens, disponibilidade real, cobrança, reservas e contratação dependem da implantação. Não envie cartão, documentos, senhas ou chaves no chat.

## Condições publicadas

Site: R$ 3.990 no Pix ou 12x de R$ 399 no cartão (total parcelado R$ 4.788). PMS mensal no cartão recorrente: Básico79, Com Bia149, Completo249. Combo: site + plano Com Bia149/mês. Confirmar condições da proposta e contrato com a equipe.

## Arquitetura

Frontend estático em GitHub Pages: index.html, bia.js e imagens. Endpoint: https://lightseagreen-kangaroo-398104.hostingersite.com/api/refugio. Código privado de integração do backend em /workspace/refugio-ia/backend, preservando o Zelador, DataJud e DJEN.

Não adicionar credenciais ao repositório. O catálogo comercial da IA fica no backend: mudanças no HTML não atualizam automaticamente os valores informados pela Bia. Manter ambos consistentes. Não há canal comercial confirmado até o proprietário indicá-lo.
