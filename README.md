# Elo Preview

Protótipo estático de simulador comercial para personalização de brindes.

## Como rodar

```bash
node serve.mjs
```

Depois acesse `http://127.0.0.1:4174` dentro da pasta `elo-preview`.

## O que já está no MVP

- seleção de produto por código, nome ou categoria;
- upload de imagem própria do produto;
- upload de logo PNG, JPG, WebP ou SVG;
- remoção simples de fundo branco;
- ajuste de posição, tamanho, rotação, opacidade e curvatura;
- corte automático do logo pelo recorte visível do produto;
- troca de cor do logo para original, preto, branco, dourado, prata ou personalizada;
- seleção de técnica visual;
- alerta comercial de contraste e limitação de laser;
- exportação do mockup em PNG;
- geração de ficha de prévia visual imprimível;
- aviso obrigatório de simulação no editor, na imagem exportada e na ficha.

## Próximos passos sugeridos

- substituir dados mockados por produtos reais do site da Elo;
- cadastrar áreas reais de gravação por produto;
- conectar armazenamento de logos e versões por cliente;
- gerar PDF direto no navegador ou no servidor;
- adicionar link compartilhável de aprovação.

## Importar produtos do site da Elo

O importador lê as páginas públicas de `https://www.elobrindes.com.br/produtos`, baixa as imagens para `assets/elo-products` e gera um JSON compatível com o Elo Preview.

```bash
node scripts/import-elo-catalog.mjs --pages=4 --limit=80 --output=products.elobrindes.json --write=true
```

Para importar o catálogo inteiro, aumente `--pages` até o total exibido no site. Use com calma para não sobrecarregar o servidor.
