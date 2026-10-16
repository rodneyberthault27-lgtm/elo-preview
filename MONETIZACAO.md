# Portal e publicidade

## Conta informada pelo titular

Publisher ID: `pub-9069202979021478`. A metatag `google-adsense-account` usa `ca-pub-9069202979021478` no editor e nas páginas do blog. Ela identifica a conta para a verificação, sem executar scripts de publicidade.

O endereço para cadastrar no AdSense é `rodneyberthault27-lgtm.github.io`, sem `/elo-preview/blog/`. A raiz é publicada pelo repositório `rodneyberthault27-lgtm.github.io`; ela apresenta o portal e disponibiliza `/ads.txt` com a conta correta. Os arquivos dessa raiz são gerados com `node scripts/build-adsense-root.mjs ../adsense-root`, depois de gerar o blog. Faça commit e push no repositório raiz para atualizar essa entrada.

No painel do AdSense: adicionar o site, selecionar o método **Metatag**, verificar e solicitar revisão. A existência da conta, da metatag e do ads.txt não comprova aprovação. As pendências de cadastro, pagamento e status só podem ser confirmadas no painel autenticado do titular.

O editor continua na raiz. O portal fica em `/blog/` e a página para copiar o iframe em `/blog/incorporar.html`. Os guias são páginas HTML estáticas, com metadados e navegação sem depender de JavaScript.

## Publicar e manter

O workflow `.github/workflows/pages.yml` publica a branch `main` no GitHub Pages. Ative Pages com origem GitHub Actions nas configurações do repositório, se necessário. O endereço previsto é `https://rodneyberthault27-lgtm.github.io/elo-preview/blog/`.

Para editar os textos, altere `scripts/build-blog.mjs` e rode `node scripts/build-blog.mjs`. CSS e JavaScript ficam em `blog/`. Não edite só o HTML gerado: ele será substituído na próxima geração.

## O que está ativo

- Portal com quatro guias originais, simulador incorporado e gerador de código para outros blogs.
- Páginas de sobre, contato, privacidade e termos.
- Espaços identificados para publicidade, sem rede de anúncios e sem cobrança automática.
- Contato público pelo GitHub; substitua por um canal comercial próprio antes de ampliar a divulgação.

## O que ainda depende do responsável

1. Revisar a identidade e os direitos de uso comercial das imagens do catálogo e da marca Elo. A presença no repositório não comprova autorização para exploração publicitária.
2. Definir um canal de contato comercial e manter conteúdo próprio útil, preciso e atualizado. Quatro guias não garantem aprovação nem tráfego.
3. A conta já foi criada pelo titular. Cadastrar `rodneyberthault27-lgtm.github.io` no AdSense. Cadastros, identidade, dados bancários e fiscais devem ser informados pelo titular.
4. Submeter o site à análise. Anúncios só podem ser exibidos quando o site estiver aprovado. Não existe garantia de aprovação ou receita.
5. Depois de obter publisher ID e blocos reais, implementar anúncios apenas nas páginas de conteúdo, fora do iframe e afastados dos controles. Não inserir scripts publicitários no editor ou em fichas de aprovação.
6. Antes de carregar publicidade, configurar a privacidade e o consentimento exigidos para a audiência e a rede escolhida, atualizar a política e configurar a CMP certificada do Google quando exigida. Não tratar um banner genérico como substituto da CMP.
7. Conferir o registro do `ads.txt` na raiz `https://rodneyberthault27-lgtm.github.io/ads.txt`. O arquivo usa o ID real informado pelo titular. Não confundir `/elo-preview/ads.txt` com `/ads.txt`. Domínio próprio continua sendo uma opção futura, mas não é necessário para esta preparação técnica.

Como alternativa, é possível negociar patrocínios diretos com fornecedores e identificar as peças como publicidade. Não há anunciantes contratados nesta versão. Ao incorporar em um blog de terceiros, a receita dos anúncios externos ao iframe pertence ao responsável pela conta configurada nesse blog. Não há partilha automática com o autor do simulador.

## Referências oficiais

- https://support.google.com/adsense/answer/3394713?hl=pt-BR — anúncios em iframes e implementação.
- https://support.google.com/adsense/answer/12131223?hl=pt-BR — revisão de sites.
- https://support.google.com/adsense/answer/7299563?hl=pt-BR — conteúdo e experiência.
- https://support.google.com/adsense/answer/12169212?hl=pt-BR — cadastro do site.

Não anunciar monetização como ativa até que anúncios reais estejam configurados, aprovados e verificados.
