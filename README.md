# PMS Refugio - GitHub Pages

## Subir em 2 minutos
1. Crie repo no GitHub chamado `pms-refugio` (publico)
2. Suba TODOS os arquivos desta pasta (index.html + *.webp)
3. Settings > Pages > Branch: main > Folder: / (root) > Save
4. Abra: https://SEU-USUARIO.github.io/pms-refugio/

## Comandos
```bash
git init
git add .
git commit -m "PMS Refugio - versao oficial"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/pms-refugio.git
git push -u origin main
# para atualizar depois:
# git add . && git commit -m "atualizacao" && git push
```

## OBSERVACOES - LEIA ANTES DE TESTAR
1. GitHub Pages e ESTATICO: o site abre 100% (Hero Carrossel, calendario PMS, Bia lateral, calculadora, criador de sites).
2. Nao funciona no GitHub Pages: salvar no banco do app. Aqui salva no navegador (localStorage) para teste. Para producao final, use versao com backend.
3. NUNCA coloque chave de API real (Gemini/Groq/Mercado Pago) dentro do index.html. Chave no codigo = todo mundo ve. Use o campo dentro do site, que salva so no navegador.
4. Pix real: use sua chave Pix do banco + link do Mercado Pago (R$ 3.990 em 12x). PMS recorrente: links de assinatura Mercado Pago (79/149/249).
5. Teste no celular e no computador. Se o carrossel nao trocar, limpe cache Ctrl+Shift+R.
6. Se as imagens nao aparecerem, confira que subiu os arquivos .webp junto com index.html, na mesma pasta.

## Modelo oficial travado
- Site: R$ 3.990 no Pix ou 12x de R$ 399 no Cartao. Paga 1 vez, e seu.
- PMS: SOMENTE Cartao recorrente. Basico 79, Com Bia 149, Completo 249.
- Sem Vrbo. So Airbnb + Booking + Site Direto. Sem comissao.
