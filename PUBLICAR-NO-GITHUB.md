# Publicação pendente

O GitHub recusou a criação de `Comandante22/pms-refugio`: `Resource not accessible by integration (createRepository)`. Não houve repositório criado, upload nem Pages ativado.

## Para o agente autorizado
1. Criar repositório `pms-refugio` na conta correta. Para Pages gratuito, normalmente o repositório precisa ser público; confirmar o plano se for privado.
2. Enviar o conteúdo deste pacote para a branch `main`, mantendo `index.html`, `app.js`, `style.css` e `.nojekyll` na raiz. O código já está compilado: não precisa executar npm para publicar esses arquivos.
3. Settings → Pages → Deploy from a branch → `main` → `/ (root)`.
4. Aguardar o deploy e conferir o endereço retornado pelo GitHub. O endereço esperado por convenção não comprova publicação; não apresentá-lo como ativo antes de testar.
5. Abrir o endereço, carregar exemplos, criar reserva fictícia, recarregar, conferir persistência. Repetir em viewport de celular. Não há sincronização entre aparelhos.
6. Não incluir .data, .env, senhas ou URLs iCal reais. Nenhuma dessas credenciais está neste pacote.

O outro agente poderá usar o ZIP completo ou somente os quatro arquivos de publicação para Pages. A fonte em src/ e os arquivos de build permitem continuar o desenvolvimento. Este é o segundo pacote enviado pelo proprietário, adaptado para Pages, separado do Bairro Papo e da Sabrina existentes.
