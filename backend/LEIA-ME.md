# Backend da Bia

Estes módulos rodam no servidor Node.js, não no GitHub Pages.

Servidor atual: lightseagreen-kangaroo-398104.hostingersite.com. Rota: POST /api/refugio, restrita à origem https://comandante22.github.io.

Ao atualizar o Zelador, preserve os dois arquivos refugio-agent.mjs e refugio-route.mjs na raiz do servidor, e em server.mjs use:

```js
import {withRefugio} from './refugio-route.mjs';
import {createServer} from './http.mjs';
const port=Number(process.env.PORT)||8794;
withRefugio(createServer()).listen(port,'0.0.0.0');
```

As rotas anteriores do Zelador, DataJud e DJEN continuam no manipulador original. Não substituir o restante do projeto por versões antigas.

O servidor já tem OMNIROUTE_API_KEY e OMNIROUTE_MODEL configuradas no ambiente secreto; OMNIROUTE_BASE_URL é opcional. Nunca colocar valores dessas variáveis no GitHub ou no navegador.

O catálogo e contato comercial da Bia ficam na constante KNOWLEDGE em refugio-agent.mjs. Atualizar os valores ali e no site juntos. Contato confirmado: OUTS Estúdio Web, WhatsApp (24)99853-3753, https://wa.me/5524998533753. Não existe cobrança, publicação, reserva real ou envio automático de mensagens neste chat.
