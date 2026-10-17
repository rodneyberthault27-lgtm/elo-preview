// Guias adicionais do portal. Cada seção aceita HTML simples (p, ul, ol, strong).
const p = (...parts) => parts.map(t => `<p>${t}</p>`).join('');
const ul = items => `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
const ol = items => `<ol>${items.map(i => `<li>${i}</li>`).join('')}</ol>`;

export const extraArticles = [
  {slug:'brindes-de-fim-de-ano-para-clientes', title:'Brindes de fim de ano para clientes: como escolher sem cair no óbvio', tag:'Datas comemorativas', intro:'Um método para escolher o presente corporativo de dezembro pensando em quem recebe, no orçamento e no prazo.', sections:[
    ['Por que o brinde de fim de ano é diferente', p(
      'Em dezembro, o cliente recebe vários presentes ao mesmo tempo. A agenda, o panetone e a caneta chegam juntos, e a maioria vai para uma gaveta antes de janeiro. O brinde de fim de ano compete com outros brindes, não com a ausência deles. Por isso a pergunta certa não é “o que é bonito”, e sim “o que essa pessoa vai usar em fevereiro”.',
      'O segundo ponto é o calendário. Fornecedores concentram pedidos entre outubro e novembro, e a fila de produção cresce. Quem decide na primeira semana de dezembro costuma aceitar o que tem em estoque, não o que planejou.')],
    ['Comece pela segmentação, não pelo produto', p(
      'Separe a lista de clientes em três grupos antes de abrir qualquer catálogo:')+ul([
      '<strong>Clientes estratégicos:</strong> poucos nomes, alto valor. Aceitam um item mais caro e uma embalagem mais cuidada, com mensagem assinada.',
      '<strong>Clientes ativos:</strong> o volume principal. Pedem um item útil, com boa percepção de qualidade e custo controlado.',
      '<strong>Contatos e parceiros:</strong> fornecedores, imprensa, indicadores. Um item simples e bem personalizado resolve.'])+p(
      'Com três faixas, você negocia quantidades maiores do item intermediário e concentra a verba onde ela tem retorno.')],
    ['Critérios que ajudam a decidir', ul([
      '<strong>Frequência de uso:</strong> garrafas térmicas, canecas, cadernos e carregadores ficam à vista no dia a dia. Itens decorativos tendem a sumir.',
      '<strong>Área de marcação:</strong> um logo discreto e bem aplicado é mais usado do que uma marca grande. Brinde que parece propaganda vira objeto de casa só se for muito bom.',
      '<strong>Logística:</strong> itens frágeis, pesados ou perecíveis encarecem o envio. Se os clientes estão em várias cidades, considere o custo do frete por unidade.',
      '<strong>Coerência com a marca:</strong> uma empresa que fala de sustentabilidade e envia um item descartável cria ruído.'])],
    ['Personalização que faz diferença', p(
      'A gravação do logo é o mínimo. O que diferencia o brinde é o contexto: um cartão escrito à mão, o nome do cliente gravado no item ou uma embalagem que conta por que aquele objeto foi escolhido. Para os clientes estratégicos, vale testar a gravação individual do nome. Ela aumenta o prazo e o custo, mas reduz muito a chance de o item ser repassado.',
      'Antes de aprovar, monte uma prévia com o logo sobre a foto do produto. Ver a aplicação ajuda a decidir tamanho, posição e cor, e evita discussões depois que a produção começou.')],
    ['Cronograma recomendado', ol([
      '<strong>Até a metade de outubro:</strong> segmentar a lista, definir verba por grupo e pedir orçamentos.',
      '<strong>Final de outubro:</strong> escolher produtos, aprovar prévias e solicitar amostra quando o item for caro.',
      '<strong>Início de novembro:</strong> fechar o pedido e confirmar data de entrega por escrito.',
      '<strong>Final de novembro:</strong> receber, conferir por amostragem e preparar o envio.',
      '<strong>Primeira quinzena de dezembro:</strong> entregar. Depois do dia 15, muitas empresas já estão em ritmo de recesso.'])],
    ['Um erro comum', p(
      'Escolher um único item para todos os públicos e encomendar no limite do prazo. O resultado é um presente caro demais para a maioria e simples demais para os clientes que mais importam. Dividir a verba em faixas e começar cedo resolve os dois problemas.')]
  ]},
  {slug:'kit-boas-vindas-funcionarios', title:'Kit de boas-vindas para funcionários: o que colocar e como montar', tag:'Endomarketing', intro:'Como montar um kit de onboarding útil, coerente com a cultura da empresa e viável no orçamento.', sections:[
    ['Para que serve o kit', p(
      'O kit de boas-vindas é o primeiro objeto físico que o novo colaborador recebe da empresa. Ele comunica cuidado e organização antes de qualquer treinamento. Um kit bem pensado ajuda a pessoa a começar a trabalhar. Um kit genérico vira um conjunto de objetos sem uso na mesa.',
      'O objetivo, portanto, é duplo: ser útil na primeira semana e representar a cultura da empresa de forma concreta.')],
    ['Itens que costumam funcionar', ul([
      '<strong>Garrafa ou copo térmico:</strong> uso diário, alta visibilidade, reduz descartáveis no escritório.',
      '<strong>Caderno e caneta:</strong> úteis nas reuniões de integração. Prefira um caderno de boa gramatura a vários itens de papelaria baratos.',
      '<strong>Item de tecnologia:</strong> carregador portátil, cabo multiuso ou suporte para notebook, quando o trabalho for híbrido.',
      '<strong>Camiseta ou moletom:</strong> funciona quando a empresa tem eventos ou cultura de uniforme informal. Exige grade de tamanhos, o que complica o estoque.',
      '<strong>Material de orientação:</strong> um cartão com contatos importantes, acesso aos sistemas e a agenda da primeira semana.'])],
    ['Como definir o conteúdo', ol([
      'Liste o que o colaborador realmente precisa nos primeiros dez dias.',
      'Corte o que já é fornecido pela empresa, como notebook e crachá.',
      'Escolha de dois a quatro itens de qualidade, em vez de oito itens simples.',
      'Defina uma linguagem visual única para todo o kit: mesma cor de gravação, mesmo tamanho de logo, mesma tipografia nos impressos.',
      'Inclua uma mensagem assinada pela liderança ou pelo gestor direto.'])],
    ['Estoque e reposição', p(
      'Diferente de um evento, o onboarding é contínuo. Calcule as contratações previstas para os próximos seis meses e encomende para esse período, com uma margem pequena. Encomendar para um ano inteiro reduz o custo unitário, mas aumenta o risco de o kit ficar desatualizado se a marca mudar.',
      'Guarde os itens em caixas fechadas, longe de umidade e sol. Garrafas e canecas costumam durar bem; tecidos e papéis exigem mais cuidado.')],
    ['Kits para quem trabalha remoto', p(
      'Para equipes remotas, o envio é parte da experiência. Programe a entrega para chegar antes do primeiro dia, confirme o endereço com antecedência e escolha uma embalagem que proteja os itens. Um kit que chega amassado, ou depois da primeira semana, perde o efeito.')],
    ['Antes de produzir', p(
      'Monte uma prévia de cada item com o logo aplicado e veja o conjunto lado a lado. Itens de fornecedores diferentes podem ter tons de cor distintos, e só a comparação revela isso. Peça a referência de cor para cada fornecedor e, se possível, uma amostra do item principal.')]
  ]},
  {slug:'brindes-para-feiras-e-eventos', title:'Brindes para feiras e eventos: como atrair visitas e gerar contatos', tag:'Eventos', intro:'Como escolher o brinde do estande pensando em fluxo, qualificação de contatos e custo por lead.', sections:[
    ['O brinde é parte da estratégia do estande', p(
      'Em feiras, o brinde costuma ser tratado como item de cortesia, distribuído para quem passa. Isso esvazia a mesa em poucas horas e não gera nenhum contato útil. O brinde funciona melhor quando tem uma função clara dentro do estande: atrair, qualificar ou fidelizar.')],
    ['Três níveis de brinde', ul([
      '<strong>Brinde de atração:</strong> item de baixo custo e grande volume, como canetas, balas personalizadas ou adesivos. Serve para iniciar a conversa.',
      '<strong>Brinde de troca:</strong> entregue em troca de um cadastro, de uma demonstração ou de uma resposta a um questionário. Precisa ter valor percebido maior, como garrafa, caderno ou ecobag.',
      '<strong>Brinde de relacionamento:</strong> reservado para contatos qualificados e clientes. Pode ser enviado depois do evento, o que reforça o contato.'])],
    ['Como dimensionar a quantidade', p(
      'Use a estimativa de público da organização como teto, não como meta. Um estande médio conversa com uma fração pequena dos visitantes. Uma forma prática de calcular:')+ol([
      'Estime quantas pessoas a equipe consegue atender por hora.',
      'Multiplique pelas horas de feira e pelo número de pessoas no estande.',
      'Use esse número para o brinde de troca. O brinde de atração pode ser de duas a três vezes maior.',
      'Reserve uma pequena quantidade do brinde de relacionamento para encontros agendados.'])],
    ['Critérios práticos para eventos', ul([
      '<strong>Peso e volume:</strong> o visitante carrega sacolas o dia todo. Itens leves e compactos são mais aceitos.',
      '<strong>Transporte até o pavilhão:</strong> considere caixas, montagem e onde guardar o estoque dentro do estande.',
      '<strong>Leitura rápida da marca:</strong> o logo precisa ser reconhecível à distância e em fotos.',
      '<strong>Chamada para ação:</strong> um QR code na embalagem ou no cartão anexo leva para uma página do evento e permite medir o interesse depois.'])],
    ['Medindo o resultado', p(
      'Registre quantos brindes de troca foram entregues e quantos cadastros foram feitos. Divida o custo total dos brindes pelo número de contatos qualificados para obter o custo por lead do evento. Esse número permite comparar feiras diferentes e decidir onde vale a pena estar no próximo ano.')],
    ['Prazo', p(
      'Encomende com pelo menos quatro a seis semanas de antecedência e peça a entrega alguns dias antes da montagem. Atrasos de transporte são comuns perto de grandes feiras, e brinde que chega no segundo dia perde metade da utilidade.')]
  ]},
  {slug:'como-calcular-orcamento-de-brindes', title:'Como calcular o orçamento de brindes personalizados', tag:'Orçamento', intro:'Os componentes do preço, como comparar propostas e como pensar em custo por pessoa impactada.', sections:[
    ['O que compõe o preço de um brinde', p(
      'O valor unitário de uma proposta raramente é só o produto. Ao comparar orçamentos, separe estes componentes:')+ul([
      '<strong>Produto base:</strong> varia com material, marca do fabricante e quantidade.',
      '<strong>Personalização:</strong> depende da técnica, do número de cores e do tamanho da área. Algumas técnicas cobram por cor, outras por posição.',
      '<strong>Custos fixos de preparação:</strong> matriz, fotolito, clichê ou configuração de máquina. Diluem com volume, por isso o preço unitário cai em quantidades maiores.',
      '<strong>Embalagem:</strong> saquinho individual, caixa, papel de seda, cartão.',
      '<strong>Frete e impostos:</strong> conferir se estão incluídos e qual modalidade de entrega foi considerada.'])],
    ['Como comparar propostas de forma justa', ol([
      'Envie exatamente o mesmo briefing a todos os fornecedores: produto, quantidade, técnica, cores, área e prazo.',
      'Peça o preço aberto por componente, não apenas o total.',
      'Confira se o produto é o mesmo modelo ou apenas parecido.',
      'Verifique prazo de produção, condição de pagamento e política para peças com defeito.',
      'Compare o valor total entregue no endereço, não o valor unitário.'])],
    ['Pense em custo por pessoa impactada', p(
      'Um brinde mais caro pode sair mais barato se for usado por mais tempo. Uma forma simples de comparar é dividir o custo do item pelo tempo estimado de uso e pelo número de pessoas que veem a marca. Uma garrafa usada diariamente durante meses em um escritório tem exposição muito maior do que um item que fica guardado.',
      'O cálculo não precisa ser exato. Ele serve para tirar a decisão do “qual é mais barato” e levar para “qual entrega mais”.')],
    ['Exemplo de raciocínio', p(
      'Imagine uma verba fixa para 300 pessoas. A opção A é um item simples para todos. A opção B divide a lista: um item intermediário para 250 pessoas e um item especial para os 50 contatos mais importantes. Com o mesmo total, a opção B costuma gerar mais retorno porque concentra valor onde ele importa. Use o simulador para testar a aplicação nos dois itens antes de decidir.')],
    ['Onde é possível economizar', ul([
      'Reduzir o número de cores da gravação.',
      'Agrupar pedidos de diferentes áreas da empresa no mesmo fornecedor.',
      'Encomendar com antecedência e evitar cobranças de urgência.',
      'Escolher produtos com estoque regular no fornecedor, em vez de importações sob encomenda.'])],
    ['Onde não vale economizar', p(
      'Na qualidade do item principal e na revisão da arte. Um brinde que quebra, desbota ou tem o logo errado custa mais do que a diferença de preço, porque associa a marca a algo malfeito.')]
  ]},
  {slug:'brindes-sustentaveis', title:'Brindes sustentáveis: como escolher sem cair em greenwashing', tag:'Sustentabilidade', intro:'Critérios práticos para avaliar materiais, durabilidade e comunicação de um brinde sustentável.', sections:[
    ['O que torna um brinde sustentável', p(
      'Não existe material sustentável por definição. Um item de bambu usado uma vez e descartado gera mais impacto do que uma garrafa de aço usada por anos. O critério mais importante é a vida útil: quanto tempo o brinde vai ser usado de fato.',
      'Por isso, antes de escolher pelo material, pergunte se a pessoa que recebe vai usar o item com frequência.')],
    ['Critérios de avaliação', ul([
      '<strong>Durabilidade:</strong> o item resiste a uso diário, lavagem e transporte?',
      '<strong>Utilidade real:</strong> substitui algo descartável, como copos, sacolas ou garrafas plásticas?',
      '<strong>Origem do material:</strong> o fornecedor informa a composição e a procedência? Existe certificação verificável?',
      '<strong>Embalagem:</strong> evite plástico individual quando não for necessário para proteger o produto.',
      '<strong>Fim de vida:</strong> o item pode ser reciclado ou reaproveitado depois?'])],
    ['Materiais comuns e o que observar', ul([
      '<strong>Aço inox:</strong> durável e reciclável. Bom para garrafas e copos térmicos.',
      '<strong>Vidro:</strong> durável, mas frágil no transporte.',
      '<strong>Bambu e madeira:</strong> renováveis, mas a qualidade varia muito. Peças com acabamento ruim racham ou mofam.',
      '<strong>Algodão e tecidos reciclados:</strong> bons para ecobags e camisetas. Peça a composição exata.',
      '<strong>Plásticos “eco”:</strong> exigem atenção. Termos como “biodegradável” podem depender de condições industriais de descarte que não existem na maioria das cidades.'])],
    ['Como evitar greenwashing na comunicação', p(
      'Greenwashing é atribuir um benefício ambiental que não pode ser comprovado. Para evitar:')+ol([
      'Use descrições específicas, como “garrafa de aço inox reutilizável”, em vez de termos vagos como “ecológico”.',
      'Só mencione certificações que o fornecedor comprovar por documento.',
      'Não exagere o impacto. Um brinde não “salva o planeta”.',
      'Mantenha coerência: um item reutilizável dentro de três camadas de plástico contradiz a mensagem.'])],
    ['Personalização em itens sustentáveis', p(
      'A gravação a laser em madeira, bambu e metal não usa tinta e costuma ser durável. Em tecidos, a serigrafia com poucas cores simplifica a produção. Teste a aplicação com o simulador e confirme com o fornecedor como cada material reage à técnica escolhida, porque fibras naturais variam de lote para lote.')]
  ]},
  {slug:'canetas-personalizadas-guia', title:'Canetas personalizadas: tipos, materiais e técnicas de gravação', tag:'Produtos', intro:'Um guia para escolher a caneta certa para cada público e aplicar o logo com boa leitura.', sections:[
    ['Por que a caneta continua relevante', p(
      'A caneta é um dos brindes mais distribuídos porque combina custo acessível, uso frequente e circulação: ela passa de mão em mão, fica sobre mesas e aparece em reuniões. O desafio é que, por ser comum, uma caneta de baixa qualidade é descartada rapidamente. A escolha do modelo define se ela vai ser usada ou esquecida.')],
    ['Principais tipos', ul([
      '<strong>Plástica:</strong> menor custo e grande variedade de cores. Indicada para eventos e grandes volumes.',
      '<strong>Metálica:</strong> percepção de valor maior, peso agradável e boa durabilidade. Indicada para clientes e kits corporativos.',
      '<strong>Caneta com função extra:</strong> ponteira para tela, marca-texto ou lanterna. Útil quando a função tem relação com o público.',
      '<strong>Materiais alternativos:</strong> bambu, papel reciclado e plásticos reciclados. Exigem atenção ao acabamento.'])],
    ['Técnicas de gravação mais usadas', ul([
      '<strong>Laser:</strong> comum em canetas metálicas. Remove a camada de pintura e revela o metal, com resultado discreto e durável. A cor final depende do material, não da arte.',
      '<strong>Tampografia:</strong> indicada para corpos plásticos e áreas curvas pequenas. Permite cores, mas tem limite de detalhes.',
      '<strong>Impressão UV:</strong> reproduz artes coloridas em algumas superfícies. Confirme aderência e resistência ao uso.'])],
    ['Área de marcação e legibilidade', p(
      'A área útil de uma caneta é estreita e curva. Um logo horizontal costuma funcionar melhor do que um símbolo alto. Textos pequenos, como slogans e sites, podem perder leitura. Na prática:')+ol([
      'Use a versão horizontal do logo, se existir.',
      'Evite linhas muito finas e textos abaixo do tamanho recomendado pelo fornecedor.',
      'Prefira uma única cor de alto contraste com o corpo da caneta.',
      'Confira a posição em relação ao clipe e ao mecanismo de acionamento.'])],
    ['Teste antes de aprovar', p(
      'O simulador de canetas do portal permite escolher uma foto, aplicar o logo e gerar uma ficha visual para conversar com o fornecedor. Teste o logo em duas ou três cores de corpo diferentes e observe a leitura em tamanho real na tela. Em pedidos maiores, peça uma amostra gravada antes de liberar toda a produção.')],
    ['Quantidade e reposição', p(
      'Canetas são consumidas rápido em recepções e eventos. Se a empresa usa o item o ano inteiro, vale combinar um modelo fixo com o fornecedor, para manter o mesmo padrão nas reposições e evitar variações de cor entre lotes.')]
  ]},
  {slug:'garrafas-e-copos-termicos-personalizados', title:'Garrafas, squeezes e copos térmicos personalizados: como escolher', tag:'Produtos', intro:'Diferenças entre os modelos, cuidados com a gravação e o que perguntar ao fornecedor.', sections:[
    ['Por que esses itens funcionam como brinde', p(
      'Garrafas e copos térmicos acompanham a pessoa na mesa de trabalho, na academia e em viagens. A marca aparece várias vezes por dia, para o usuário e para quem está por perto. Além disso, substituem descartáveis, o que conversa com políticas de sustentabilidade.')],
    ['Diferenças entre os modelos', ul([
      '<strong>Squeeze plástico ou de alumínio:</strong> leve e de menor custo. Indicado para eventos esportivos e grandes volumes. Não conserva temperatura.',
      '<strong>Garrafa térmica de aço inox:</strong> parede dupla, mantém a bebida fria ou quente por horas. Percepção de valor alta.',
      '<strong>Copo térmico:</strong> com ou sem tampa, comum para café e bebidas geladas. Verifique se a tampa veda de verdade.',
      '<strong>Garrafa de vidro:</strong> não altera o sabor, mas é mais frágil para envio.'])],
    ['O que perguntar ao fornecedor', ol([
      'Qual é a capacidade real e o peso do item vazio?',
      'O isolamento térmico é de parede dupla a vácuo? Por quanto tempo mantém a temperatura?',
      'O material em contato com a bebida é próprio para alimentos?',
      'A tampa veda totalmente ou só evita respingos?',
      'Qual técnica é indicada para o acabamento escolhido e qual é a área máxima de gravação?',
      'O item pode ir à lava-louças? A gravação resiste?'])],
    ['Gravação em superfícies curvas', p(
      'Garrafas e copos são cilíndricos. A arte aplicada parece menor quando vista de lado e pode se deformar perto das bordas. Na simulação, ajuste a curvatura com moderação e lembre que a prévia é ilustrativa. O fornecedor indica a área útil, que costuma ser menor do que a superfície visível na foto.',
      'Em aço com pintura, a gravação a laser revela o metal e tem boa durabilidade. Em superfícies sem pintura, a gravação pode ficar sutil. A impressão UV permite cores, mas convém confirmar a resistência à lavagem.')],
    ['Cores e combinação', p(
      'Escolha a cor do corpo pensando na leitura do logo. Corpos escuros com gravação clara costumam ter bom contraste. Se a marca tem uma cor forte, considere o corpo nessa cor e a gravação em tom neutro. Teste as opções lado a lado no simulador antes de pedir orçamento.')]
  ]},
  {slug:'briefing-para-fornecedor-de-brindes', title:'Como escrever um briefing para o fornecedor de brindes', tag:'Processo', intro:'Um modelo de briefing que reduz idas e vindas, acelera orçamentos e evita erros de produção.', sections:[
    ['Por que o briefing importa', p(
      'A maior parte dos problemas em pedidos de brindes nasce de informação incompleta: quantidade indefinida, cor sem referência, arte em baixa resolução ou prazo vago. Um briefing claro faz o fornecedor orçar mais rápido e com mais precisão, e cria um registro para comparar propostas.')],
    ['Estrutura recomendada', ol([
      '<strong>Objetivo:</strong> para que serve o brinde (evento, cliente, equipe) e quem vai receber.',
      '<strong>Produto:</strong> tipo, modelo de referência, cor do corpo e alternativas aceitáveis.',
      '<strong>Quantidade:</strong> número exato ou faixas para cotação, por exemplo 300, 500 e 1.000 unidades.',
      '<strong>Personalização:</strong> técnica desejada, número de cores, posição e tamanho aproximado.',
      '<strong>Arte:</strong> arquivo vetorial do logo e referência de cor da marca.',
      '<strong>Embalagem:</strong> individual ou coletiva, com ou sem cartão.',
      '<strong>Prazo e local:</strong> data limite de entrega e endereço completo.',
      '<strong>Orçamento de referência:</strong> uma faixa ajuda o fornecedor a sugerir alternativas adequadas.'])],
    ['Anexe uma prévia visual', p(
      'Uma imagem com o logo aplicado sobre o produto comunica posição e proporção melhor do que uma descrição. Use o simulador para gerar o PNG e a ficha de prévia. Deixe claro que é uma referência visual: a área real e a viabilidade técnica serão confirmadas pelo fornecedor.')],
    ['Perguntas que o fornecedor deve responder', ul([
      'O produto está em estoque na cor pedida?',
      'Qual é a área máxima de gravação?',
      'A técnica sugerida é a mais adequada para o material?',
      'Há custo de preparação separado?',
      'Qual é o prazo a partir da aprovação da arte?',
      'Como é feita a aprovação final: prova digital, amostra física ou foto da primeira peça?'])],
    ['Depois do orçamento', p(
      'Registre a versão aprovada da arte, a técnica, a cor e as medidas na mesma mensagem em que confirmar o pedido. Se algo mudar, peça uma nova prova. Guardar esse histórico evita discussões quando o produto chega.')]
  ]},
  {slug:'prazos-de-producao-de-brindes', title:'Prazos de produção de brindes: quanto tempo antes fazer o pedido', tag:'Planejamento', intro:'As etapas que consomem tempo em um pedido de brindes e um cronograma reverso para não perder a data.', sections:[
    ['Onde o tempo é gasto', p(
      'O prazo de produção informado pelo fornecedor costuma contar a partir da aprovação da arte e da confirmação do pagamento. Antes disso, existem etapas que muitas vezes não entram no planejamento:')+ul([
      'Definição do produto e da quantidade dentro da empresa.',
      'Pedido e comparação de orçamentos.',
      'Ajustes de arte e aprovação interna.',
      'Prova ou amostra.',
      'Produção e controle de qualidade.',
      'Transporte até o local de entrega.'])],
    ['Cronograma reverso', p(
      'Comece pela data em que o brinde precisa estar em uso e volte no calendário. Um exemplo para um evento:')+ol([
      '<strong>Data do evento:</strong> dia zero.',
      '<strong>Entrega:</strong> pelo menos três a cinco dias úteis antes, para conferência e imprevistos.',
      '<strong>Produção:</strong> o prazo informado pelo fornecedor, que varia com o produto e a técnica.',
      '<strong>Aprovação de arte e amostra:</strong> reserve de alguns dias a uma semana.',
      '<strong>Orçamentos e decisão:</strong> mais uma ou duas semanas.'])+p(
      'Na prática, para itens comuns em estoque, comece de quatro a seis semanas antes. Para itens importados, sob encomenda ou com embalagem especial, o prazo pode chegar a vários meses.')],
    ['Períodos de alta demanda', p(
      'O fim de ano, as semanas antes de grandes feiras e datas como Dia das Mães e Dia do Cliente concentram pedidos. Nesses períodos, os fornecedores trabalham com fila, e o estoque de modelos populares acaba. Antecipe a decisão nesses meses.')],
    ['Como ganhar tempo sem pagar urgência', ul([
      'Tenha o logo em vetor e a referência de cor prontos antes de pedir orçamento.',
      'Defina quem aprova e quando, para a arte não ficar parada esperando resposta.',
      'Use prévias visuais para alinhar expectativas antes da prova formal.',
      'Escolha produtos com estoque confirmado.',
      'Pergunte se é possível entregar parte do pedido antes, quando o evento tem vários dias.'])],
    ['Se o prazo estiver curto', p(
      'Priorize produtos em estoque e técnicas de preparação simples, reduza o número de cores e aceite a cor de corpo disponível. É melhor um brinde simples e bem feito no prazo do que um item elaborado que chega depois da data.')]
  ]},
  {slug:'cores-da-marca-em-brindes', title:'Cores da marca em brindes: Pantone, CMYK e o que esperar', tag:'Arquivos e cores', intro:'Por que a cor do logo muda entre tela, papel e produto, e como reduzir surpresas na produção.', sections:[
    ['Por que a cor muda', p(
      'A cor que você vê na tela é emitida por luz. A cor impressa é refletida por tinta sobre uma superfície. Plástico, metal, tecido e madeira absorvem e refletem a luz de formas diferentes. Por isso o mesmo arquivo pode gerar tons distintos em uma caneta, em uma camiseta e em uma caneca. Isso não é necessariamente erro do fornecedor, é física.')],
    ['Sistemas de cor mais usados', ul([
      '<strong>RGB:</strong> usado em telas. Não serve como referência de produção.',
      '<strong>CMYK:</strong> usado em impressão gráfica por combinação de quatro tintas. Comum em papelaria e impressão digital.',
      '<strong>Pantone:</strong> um sistema de cores de referência. Em serigrafia e tampografia, a tinta pode ser preparada para se aproximar de uma cor Pantone específica.'])],
    ['O que informar ao fornecedor', ol([
      'A referência de cor oficial da marca, de preferência no sistema indicado pelo manual de identidade.',
      'Se a cor é crítica ou se existe tolerância.',
      'A cor do material onde será aplicada, porque a base influencia o resultado.',
      'Se existe uma versão monocromática aprovada para fundos escuros ou claros.'])],
    ['Situações que exigem atenção', ul([
      '<strong>Fundo escuro:</strong> cores claras sobre fundos escuros podem precisar de uma camada de base branca.',
      '<strong>Gravação a laser:</strong> o resultado tem a cor do material revelado, não a cor da marca.',
      '<strong>Tecidos:</strong> a cor pode variar conforme a fibra e o tingimento do lote.',
      '<strong>Degradês e sombras:</strong> nem todas as técnicas reproduzem bem. Uma versão chapada do logo costuma ser mais segura.'])],
    ['Como aprovar a cor', p(
      'A prévia digital, inclusive a do simulador, serve para avaliar composição e contraste, não para aprovar a cor final. Quando a cor for importante, peça uma amostra física e confira sob luz natural. Registre a aprovação junto com a referência de cor usada, para que reposições futuras sigam o mesmo padrão.')]
  ]},
  {slug:'erros-comuns-ao-encomendar-brindes', title:'10 erros comuns ao encomendar brindes personalizados', tag:'Aprovação', intro:'Os problemas que mais aparecem em pedidos de brindes e como evitar cada um deles.', sections:[
    ['1. Escolher o produto antes de definir o objetivo', p('Sem saber para quem é o brinde e o que ele precisa provocar, a escolha vira gosto pessoal. Defina público, ocasião e resultado esperado antes de abrir o catálogo.')],
    ['2. Enviar o logo em baixa resolução', p('Uma imagem copiada do site ou de uma rede social raramente serve para produção. Tenha o arquivo vetorial e a referência de cor da marca à mão.')],
    ['3. Logo grande demais', p('Ocupar toda a área disponível parece aproveitar o espaço, mas reduz a chance de o item ser usado fora do trabalho. Um logo proporcional, bem posicionado, costuma durar mais.')],
    ['4. Ignorar a área real de gravação', p('A foto do produto mostra a superfície inteira, mas a área de marcação tem limites técnicos. Peça a medida ao fornecedor antes de aprovar a prévia.')],
    ['5. Aprovar sem prévia ou amostra', p('Uma descrição em texto deixa margem para interpretações diferentes. Uma prévia visual alinha posição e proporção, e uma amostra física confirma cor e acabamento quando o pedido é grande.')],
    ['6. Comparar orçamentos diferentes como se fossem iguais', p('Propostas com produtos, técnicas ou número de cores diferentes não são comparáveis. Envie o mesmo briefing a todos e peça os valores abertos por componente.')],
    ['7. Esquecer frete e embalagem', p('O custo final inclui transporte, embalagem e, às vezes, armazenagem. Compare sempre o valor total entregue.')],
    ['8. Deixar o pedido para a última hora', p('Prazos curtos limitam o produto aos itens em estoque e podem gerar custo de urgência. Use um cronograma reverso a partir da data de uso.')],
    ['9. Não conferir a entrega', p('Abra algumas caixas assim que o pedido chegar e confira quantidade, gravação e cor por amostragem. Problemas identificados cedo têm mais chance de serem resolvidos antes do evento.')],
    ['10. Não registrar a aprovação', p('Guarde a versão final da arte, a técnica, as medidas e quem aprovou. Esse registro protege as duas partes e facilita as próximas reposições.')],
    ['Resumo prático', ul([
      'Objetivo e público definidos antes do produto.',
      'Arquivo vetorial e referência de cor prontos.',
      'Prévia visual e, quando necessário, amostra.',
      'Mesmo briefing para todos os fornecedores.',
      'Cronograma reverso com margem.',
      'Conferência na entrega e registro da aprovação.'])]
  ]},
  {slug:'como-medir-resultado-de-brindes', title:'Como medir o resultado de brindes promocionais', tag:'Resultados', intro:'Indicadores simples para saber se o investimento em brindes trouxe contatos, vendas ou relacionamento.', sections:[
    ['Por que medir', p(
      'Brindes costumam ser tratados como custo fixo de marketing, renovado todo ano sem avaliação. Medir, mesmo de forma simples, permite comparar ações, justificar a verba e cortar o que não funciona.')],
    ['Defina o objetivo antes de medir', ul([
      '<strong>Geração de contatos:</strong> quantos cadastros o brinde ajudou a gerar.',
      '<strong>Conversão:</strong> quantos contatos viraram reunião, proposta ou venda.',
      '<strong>Relacionamento:</strong> renovação de contrato, recompra ou indicação de clientes que receberam o brinde.',
      '<strong>Reconhecimento:</strong> menções, fotos e publicações com o brinde.'])],
    ['Ferramentas simples de rastreamento', ol([
      '<strong>QR code com link rastreado:</strong> coloque um QR code no cartão ou na embalagem, apontando para uma página específica. Use parâmetros UTM no link para identificar a origem nas ferramentas de análise do site.',
      '<strong>Cupom exclusivo:</strong> um código de desconto impresso no material permite contar quantas compras vieram daquela ação.',
      '<strong>Página dedicada:</strong> uma página criada só para o evento ou a campanha mostra acessos sem misturar com o restante do site.',
      '<strong>Registro no CRM:</strong> marque os contatos que receberam o brinde para comparar o comportamento deles com o de outros clientes.'])],
    ['Indicadores úteis', ul([
      '<strong>Custo por contato:</strong> custo total dos brindes dividido pelo número de contatos gerados.',
      '<strong>Taxa de resposta:</strong> pessoas que acessaram o QR code ou usaram o cupom, dividido pelo número de brindes entregues.',
      '<strong>Receita atribuída:</strong> vendas fechadas com contatos que vieram da ação, em um período definido.',
      '<strong>Retorno sobre o investimento:</strong> receita atribuída menos custo, dividida pelo custo.'])],
    ['Limitações', p(
      'Nem todo efeito do brinde é rastreável. A presença diária de uma garrafa com o logo na mesa de um cliente dificilmente aparece em um relatório. Por isso, combine os indicadores com uma avaliação qualitativa: pergunte à equipe comercial quais clientes comentaram o brinde e se a ação abriu conversas.')],
    ['Um processo enxuto', p(
      'Para cada ação: defina o objetivo, escolha um indicador principal, coloque um mecanismo de rastreamento e registre o resultado em uma planilha simples, com custo, quantidade, contatos e vendas. Depois de algumas ações, a comparação mostra quais brindes e quais ocasiões valem a repetição.')]
  ]}
];
