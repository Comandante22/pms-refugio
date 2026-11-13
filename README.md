# PMS Refúgio · Bairro Papo — teste Airbnb e Booking

Base: segundo arquivo enviado, `Pms+Refugio+Com+Sincronia (1).tar.gz`. O primeiro pacote não é a base deste código.

## O que funciona
- Dashboard: ocupação, chegadas e saídas de hoje no horário de Brasília; valor das reservas do mês, sem comprovação de receita recebida.
- 6 quartos demonstrativos: Vista Mar, Família e Econômico, com tarifas fictícias explicitamente marcadas.
- Calendário de 14 dias, navegação, verde livre / vermelho ocupado / amarelo limpeza.
- Reservas manuais, validação de datas/diária/e-mail, prevenção de sobreposição e atualização de situação. Check-in marca Hospedado.
- Cinco exemplos sob ação explícita, sem injetar dados falsos automaticamente.
- Persistência em localStorage somente neste navegador. Recarregar preserva dados, salvo navegação privada, limpeza de armazenamento ou bloqueio do navegador. NÃO sincroniza celular e computador.
- Importação manual iCal por quarto/canal. Leitura de link HTTPS oficial quando o canal permite CORS; alternativa por conteúdo .ics. URLs só ficam na memória da página e não são gravadas no repositório nem no localStorage.
- Reimportação substitui os bloqueios daquele quarto e canal, após confirmação; reconcilia eventos movidos/removidos/cancelados. Erros preservam o calendário anterior. Calendários de dia inteiro, UID obrigatório; recorrências e eventos com hora são rejeitados em vez de liberar datas por engano.
- “Sincronizar as duas agora” tenta importar os dois lados e apresenta resultado individual. Não altera horários de sucesso em falhas.
- Exportação por quarto com UID estável, sem nome ou e-mail do hóspede.

## Limites importantes
GitHub Pages é hospedagem estática. Não há servidor, banco compartilhado, agendamento automático, feed iCal hospedado, segredo de API ou integração atual com Sabrina/Bairro Papo. Exportar baixa um arquivo: isso NÃO cria um URL assinável para Airbnb/Booking e NÃO atualiza essas plataformas. Os calendários externos normalmente exigem URL para assinatura; essa etapa precisa de backend futuro. iCal só transporta datas e pode ter atraso; não transfere tarifas e não elimina overbooking.

Não se trata ainda de um channel manager ou motor de reservas de produção. Use dados fictícios. O futuro backend deverá autenticar usuários, compartilhar reservas, manter feeds privados, consultar periodicamente os canais, reconciliar bloqueios e bloquear disponibilidade de forma transacional antes de confirmação pela Sabrina. A API da assistente deve aplicar autorização por pousada e confirmação humana enquanto a disponibilidade não for confiável.

## GitHub Pages
Os arquivos prontos `index.html`, `app.js`, `style.css` e `.nojekyll` ficam na raiz. Não precisam de build no GitHub. Em Settings → Pages: Deploy from a branch → main → / (root). Links relativos funcionam no subdiretório `/pms-refugio/`.

A página pode ser pública sem expor as reservas locais de outros navegadores: o código é público, seus registros ficam apenas neste navegador. Ainda assim use dados fictícios nesta demonstração. Nenhum link iCal real ou credencial está incluído.

## Desenvolvimento
Requer Node.js 22+.
```
npm ci
npm test
npm run build
```
Para testar os arquivos de publicação:
```
python -m http.server 4187
```
Abra http://127.0.0.1:4187. Evite abrir via file://. O build restaura o HTML de entrada de scripts/index.template.html e gera os três arquivos na raiz para Pages.

## Verificação realizada
Cinco testes automatizados: datas/preços, conflito/cancelamento/idempotência, iCal inválido, reconciliação entre canais e exportação privada. Teste Chromium em desktop e viewport móvel 390px: cinco exemplos, nova reserva, persistência após recarga, importação e download iCal, sem erro de JS e sem overflow horizontal da página. Os calendários possuem rolagem horizontal própria. Isso não equivale a teste em dois aparelhos físicos nem a sincronização real de contas Airbnb/Booking.

## GitHub
A criação automática de repositório foi recusada pela integração (`Resource not accessible by integration`). Os arquivos estão preparados; o upload e ativação de Pages dependem de um repositório com acesso de escrita liberado. Não confundir o link provisório de teste com um GitHub Pages já publicado.
