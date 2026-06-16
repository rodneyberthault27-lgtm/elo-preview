# Elo Preview

Prototipo estatico de simulador comercial para personalizacao de brindes.

## Como rodar

```bash
node serve.mjs
```

Depois acesse `http://127.0.0.1:4174` dentro da pasta `elo-preview`.

## O que ja esta no MVP

- selecao de produto por codigo, nome ou categoria;
- upload de imagem propria do produto;
- upload de logo PNG, JPG, WebP ou SVG;
- remocao simples de fundo branco;
- ajuste de posicao, tamanho, rotacao, opacidade e curvatura;
- corte automatico do logo pelo recorte visivel do produto;
- troca de cor do logo para original, preto, branco, dourado, prata ou personalizada;
- selecao de tecnica visual;
- alerta comercial de contraste e limitacao de laser;
- exportacao do mockup em PNG;
- geracao de ficha de previa visual imprimivel;
- aviso obrigatorio de simulacao no editor, na imagem exportada e na ficha.

## Proximos passos sugeridos

- substituir dados mockados por produtos reais do site da Elo;
- cadastrar areas reais de gravacao por produto;
- conectar armazenamento de logos e versoes por cliente;
- gerar PDF direto no navegador ou no servidor;
- adicionar link compartilhavel de aprovacao.

## Importar produtos do site da Elo

O importador le as paginas publicas de `https://www.elobrindes.com.br/produtos`, baixa as imagens para `assets/elo-products` e gera um JSON compativel com o Elo Preview.

```bash
node scripts/import-elo-catalog.mjs --pages=4 --limit=80 --output=products.elobrindes.json --write=true
```

Para importar o catalogo inteiro, aumente `--pages` ate o total exibido no site. Use com calma para nao sobrecarregar o servidor.

## Importar catalogo dos fornecedores

O script abaixo conversa com os mesmos endpoints usados nos fluxos de XBZ, Asia e Spot Gifts, normaliza tudo para o formato do Elo Preview e permite busca por codigo e nome sem depender do catalogo manual.

Teste rapido com imagens remotas:

```bash
node scripts/import-supplier-catalog.mjs --providers=xbz,asia --limit=60 --images=remote --output=products.suppliers.json
```

Gerando um `products.json` novo para o app com imagens baixadas localmente:

```bash
node scripts/import-supplier-catalog.mjs --providers=xbz,asia,spot --images=download --write=true
```

Notas:

- `--providers` aceita `xbz`, `asia`, `spot` ou combinacoes separadas por virgula;
- `--images=download` baixa as fotos para `assets/supplier-products`, o que e melhor para exportar mockups sem depender de CORS;
- se um fornecedor falhar, o script continua com os outros e mostra aviso no final.
