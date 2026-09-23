<!--
  Este README não tem dados inventados. Os números marcados com "n:" e as tabelas
  marcadas com "gerado:" são escritos por testes/readme/graficos.mjs a partir de
  data/*.json, de js/lib/sm2.js e de uma execução real dos testes
  (docs/readme/dados/testes.json). As imagens de docs/readme/ são geradas por scripts
  do repositório (veja a última seção). Para atualizar tudo, dentro de testes/,
  rode: npm run readme:visuais
-->

<h1 align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./docs/readme/banner-escuro.svg">
    <img src="./docs/readme/banner-claro.svg" width="880" alt="Rumo ao Júnior — sistema de estudo local para a prova de efetivação de Dev Júnior">
  </picture>
</h1>

<p align="center"><strong>Plano de 6 semanas, flashcards, quiz e simulados para a prova de efetivação de Dev Júnior — tudo no seu navegador.</strong></p>

<p align="center">
  <img src="./docs/readme/selos/testes.svg" height="22" alt="Testes: resultado da última execução">
  <img src="./docs/readme/selos/acessibilidade.svg" height="22" alt="Acessibilidade verificada com axe-core">
  <img src="./docs/readme/selos/dependencias.svg" height="22" alt="Dependências do app: 0">
  <img src="./docs/readme/selos/build.svg" height="22" alt="Build: nenhum">
</p>

<p align="center">
  <a href="#comece-em-1-minuto">Começar</a> ·
  <a href="#veja-funcionando">Veja funcionando</a> ·
  <a href="#o-conteúdo-em-números">Conteúdo</a> ·
  <a href="#como-funciona">Como funciona</a> ·
  <a href="./manual/index.html">Manual</a> ·
  <a href="#qualidade-testes-e-acessibilidade">Testes</a>
</p>

<p align="center">
  <img src="./docs/readme/demo-primeiro-dia.svg" width="880" alt="Demonstração: do Painel vazio ao Dia 1 do plano e ao quiz diagnóstico, gravada no app real com progresso zerado">
</p>

O **Rumo ao Júnior** é um app web que roda no seu computador para você se preparar para a prova técnica de efetivação de **Dev Júnior** — front-end, back-end ou fullstack, na stack **Vue 3 + TypeScript** e **Spring Boot**. Ele junta num lugar só o plano de estudo, a revisão espaçada, o treino no formato da prova e o registro do seu tempo.

O app é HTML, CSS e JavaScript puro (ES modules): sem build, sem framework, sem login e sem nenhum servidor externo. O conteúdo são arquivos JSON que você pode editar, e o seu progresso fica salvo no navegador, com backup em `.json`.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./docs/readme/numeros-escuro.svg">
  <img src="./docs/readme/numeros-claro.svg" width="880" alt="O projeto em números: páginas, flashcards, questões, desafios, dias de plano, itens de checklist, links e testes, contados a partir dos arquivos do projeto">
</picture>

## Por que usar

- **Um plano pronto, dia a dia.** São <!-- n:dias -->42<!-- /n --> dias com <!-- n:tarefas -->124<!-- /n --> tarefas (<!-- n:horas-plano -->71h40<!-- /n --> no total). <!-- n:tarefas-com-acao -->79<!-- /n --> delas têm um botão que abre a página certa, já configurada: o quiz com o tema e a quantidade, o desafio do simulado, o tópico da trilha.
- **Revisão que se agenda sozinha.** <!-- n:flashcards -->241<!-- /n --> flashcards em <!-- n:temas -->11<!-- /n --> temas, com o algoritmo **SM-2** (SuperMemo, 1990). Você responde, dá uma nota e o app decide quando o cartão volta.
- **Treino no formato da prova.** <!-- n:questoes -->130<!-- /n --> questões de múltipla escolha, todas com explicação, e <!-- n:desafios -->17<!-- /n --> desafios inspirados em testes técnicos reais, com cronômetro e autoavaliação pelos critérios de cada um.
- **Seu tempo e seus pontos fracos à vista.** O Pomodoro registra as horas, o quiz calcula a taxa de acerto por tema e o Painel mostra onde focar.

## Comece em 1 minuto

Você precisa do **Node.js LTS** ([nodejs.org](https://nodejs.org/)) e de internet na primeira vez. O app em si não instala nada.

1. Dê **dois cliques em `start.bat`**, na pasta do projeto.
2. Espere 8 segundos (ou aperte `1`): o servidor local sobe em `http://localhost:3000` e o navegador abre sozinho.
3. No Painel, clique em **Começar plano**. O Dia 1 começa perguntando ao RH como é a prova e segue para o quiz diagnóstico.

<p align="center">
  <img src="./docs/readme/terminal-start.svg" width="880" alt="Terminal do start.bat: menu com as opções 1 a 5, a escolha da opção 1 e as mensagens ao iniciar o servidor em http://localhost:3000">
</p>

> [!IMPORTANT]
> Não abra o `index.html` com duplo clique. No endereço `file://`, o navegador bloqueia os módulos JavaScript e a leitura dos JSON, e o app só mostra um aviso. Use o `start.bat` (ou uma das opções abaixo) e **sempre o mesmo endereço**: o progresso fica salvo por endereço.

O **manual ilustrado** ensina cada tela, passo a passo: dê dois cliques em **`manual.bat`** (ele abre sem Node), use a opção **5** do `start.bat` ou o link **Manual de uso** no rodapé do menu do app.

<details>
<summary><strong>Outras formas de abrir</strong> (terminal, Live Server, <code>npx serve</code>, outra porta)</summary>

<br>

**Pelo terminal do VS Code (PowerShell)**, escreva `.\` antes do nome:

```powershell
.\start.bat            # menu (abre o app sozinho em 8 segundos)
.\start.bat app        # abre o app direto
.\start.bat testes     # roda os testes (instala as dependências na 1ª vez)
.\start.bat ui         # testes no modo visual do Playwright
.\start.bat relatorio  # relatório da última execução dos testes
.\start.bat manual     # abre o manual de uso (não precisa de Node)
```

O que o `start.bat` faz:

- confere o Node.js e, se faltar, explica como instalar;
- vê se o app já está aberto na porta: se estiver, só abre o navegador; se a porta estiver ocupada por outro programa, avisa;
- sobe o servidor com o `serve` já instalado pelos testes ou, se não houver, com `npx --yes serve`;
- abre o navegador assim que o servidor responde e mantém a janela aberta enquanto você estuda (`Ctrl+C` encerra).

**Outra porta:** rode `set PORTA=3001` (cmd) ou `$env:PORTA=3001` (PowerShell) antes do `start.bat`. Outra porta é outro endereço, e portanto outro progresso.

**Live Server (extensão do VS Code):** instale **Live Server** (Ritwick Dey), clique com o botão direito em `index.html` → **Open with Live Server**. Abre em `http://127.0.0.1:5500/index.html` e recarrega sozinho quando você salva um JSON.

**`npx serve`:** no terminal, dentro da pasta `prova`, rode `npx serve` e abra `http://localhost:3000`. `Ctrl+C` para parar.

</details>

## O que tem dentro

| Página | O que você faz lá | Em números |
|---|---|---|
| **Painel** | Vê o dia do plano, a próxima tarefa, a sequência de dias, as revisões e as horas da semana, os pontos fracos do quiz e o lembrete de backup | <!-- n:itens-progresso -->349<!-- /n --> itens contam para o progresso geral |
| **Trilhas** | Estuda por tópico: prioridade, descrição, links "Onde estudar", checklist marcável e suas anotações | <!-- n:trilhas -->4<!-- /n --> trilhas, <!-- n:topicos -->32<!-- /n --> tópicos, <!-- n:itens -->225<!-- /n --> itens |
| **Cronograma** | Segue o plano semana a semana, marca tarefas e abre a página de cada uma | <!-- n:semanas -->6<!-- /n --> semanas, <!-- n:dias -->42<!-- /n --> dias, <!-- n:tarefas -->124<!-- /n --> tarefas |
| **Flashcards** | Revisa a fila do dia com SM-2, cria cartões próprios e faz treino livre | <!-- n:flashcards -->241<!-- /n --> cartões, <!-- n:novos-por-dia -->15<!-- /n --> novos por dia (ajustável) |
| **Quiz** | Treina com correção na hora ou faz prova cronometrada; erros viram flashcards | <!-- n:questoes -->130<!-- /n --> questões com explicação |
| **Simulado** | Faz um desafio no formato de teste técnico, com cronômetro, rascunho e autoavaliação | <!-- n:desafios -->17<!-- /n --> desafios, <!-- n:gabaritos -->6<!-- /n --> com gabarito |
| **Pomodoro** | Foca 25 minutos, pausa 5 e registra as horas (ou registra à mão) | as horas vão para o Painel e o Diário |
| **Diário** | Escreve o que estudou, o que ficou difícil e o próximo passo | o "difícil" vira flashcard (a pergunta já vem preenchida) |
| **Recursos** | Acha links gratuitos por categoria e idioma | <!-- n:links -->138<!-- /n --> links em <!-- n:categorias -->14<!-- /n --> categorias, verificados em <!-- n:links-verificados-em -->23/09/2026<!-- /n --> |
| **Ajustes e backup** | Escolhe o tema, as datas e as metas, exporta e importa o backup e confere o conteúdo carregado | backup em `.json` |

O passo a passo de cada tela, com prints e legendas numeradas, está no [manual](./manual/index.html).

## Veja funcionando

Todas as demonstrações abaixo foram **gravadas no app de verdade**, com o progresso zerado e interações reais (cliques, teclas, uma resposta errada de propósito). O relógio só é adiantado no Pomodoro e no Simulado, e a legenda avisa quando isso acontece. Elas param sozinhas depois de algumas voltas.

### Flashcards com repetição espaçada

A pergunta aparece sozinha; `Espaço` revela a resposta e as teclas `1` a `4` dão a nota. O cartão que você erra volta no fim da fila, no mesmo dia.

<p align="center"><img src="./docs/readme/demo-flashcards.svg" width="880" alt="Demonstração de flashcards: pergunta, resposta revelada, notas Bom e Errei, o cartão errado voltando como Reforço e o resumo da sessão"></p>

### Quiz com correção e explicação

No modo treino, a correção mostra a alternativa certa, a sua e a explicação. Todo erro pode virar um flashcard.

<p align="center"><img src="./docs/readme/demo-quiz.svg" width="880" alt="Demonstração do quiz: configuração com 5 questões de SQL, uma resposta errada, a correção com explicação, o erro virando flashcard e o resultado"></p>

### Simulado cronometrado

Cronômetro regressivo (que continua se você trocar de página), rascunho salvo sozinho e autoavaliação pelos critérios do desafio.

<p align="center"><img src="./docs/readme/demo-simulado.svg" width="880" alt="Demonstração do simulado: lista de desafios, enunciado, cronômetro de 1h30, rascunho, autoavaliação por critérios e a tentativa salva"></p>

### Pomodoro que conta as horas

Os minutos de foco viram horas estudadas no Painel. O tempo aparece também no título da aba e no menu.

<p align="center"><img src="./docs/readme/demo-pomodoro.svg" width="880" alt="Demonstração do Pomodoro: início do foco, anel com o tempo, fim do foco com a pausa começando sozinha e as horas no Painel"></p>

<details>
<summary><strong>Mais demonstrações:</strong> Trilhas, Cronograma, Diário, Recursos e Ajustes · tema escuro · celular</summary>

<br>

<p align="center"><img src="./docs/readme/demo-tour.svg" width="880" alt="Demonstração das páginas Trilhas, Cronograma, Diário, Recursos e Ajustes"></p>

<p align="center"><img src="./docs/readme/demo-tema.svg" width="880" alt="Demonstração do tema claro e do tema escuro"></p>

<p align="center"><img src="./docs/readme/demo-celular.svg" width="880" alt="Demonstração no celular: menu em gaveta e flashcard"></p>

</details>

## O conteúdo em números

Tudo o que o app ensina está em `data/*.json`. Os gráficos abaixo são desenhados a partir desses arquivos, e cada um diz de qual arquivo veio.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./docs/readme/grafico-cronograma-escuro.svg">
  <img src="./docs/readme/grafico-cronograma-claro.svg" width="880" alt="Gráfico de barras empilhadas: minutos por tipo de tarefa em cada uma das 6 semanas do cronograma">
</picture>

A rotina-base é de cerca de **1h45 por dia**: 30 min de algoritmo, 60 min de estudo ou projeto e 15 min de flashcards. <!-- n:dias-1h45 -->24<!-- /n --> dos <!-- n:dias -->42<!-- /n --> dias têm exatamente esse tempo; os dias de simulado são mais longos, e o domingo é de descanso ativo, só com a fila de flashcards.

<details>
<summary>Tabela: tempo por semana e por tipo de tarefa</summary>

<br>

<!-- gerado:cronograma -->
| Semana | Foco | Tarefas | Algoritmo | Estudo | Projeto | Revisão | Simulado | Descanso ativo | Total |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | Fundamentos: lógica, estruturas, Git e HTTP | 23 | 3h | 5h35 | — | 2h05 | 30 min | 15 min | **11h25** |
| 2 | POO, SQL, testes e clean code | 20 | 3h | 5h40 | — | 1h30 | 40 min | 15 min | **11h05** |
| 3 | Projeto front: Vue 3 + TypeScript consumindo API pública | 20 | 3h | — | 6h | 1h45 | — | 15 min | **11h** |
| 4 | Projeto back: API REST com Spring Boot | 20 | 3h | — | 6h | 1h45 | — | 15 min | **11h** |
| 5 | Simulados I: os formatos da prova | 19 | 3h | — | — | 2h30 | 7h30 | 15 min | **13h15** |
| 6 | Simulados II e reta final | 22 | 2h45 | 2h15 | — | 2h05 | 6h25 | 25 min | **13h55** |
<!-- /gerado:cronograma -->

</details>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./docs/readme/grafico-temas-escuro.svg">
  <img src="./docs/readme/grafico-temas-claro.svg" width="880" alt="Gráfico de barras: flashcards e questões de quiz em cada um dos 11 temas">
</picture>

<details>
<summary>Tabela: flashcards e questões por tema</summary>

<br>

<!-- gerado:temas -->
| Tema | Flashcards | Questões |
|---|---:|---:|
| JavaScript e TypeScript | 23 | 14 |
| Vue 3 | 20 | 11 |
| HTML e CSS | 17 | 10 |
| Java | 23 | 11 |
| Spring Boot | 29 | 14 |
| SQL e Bancos de Dados | 21 | 12 |
| Git | 18 | 12 |
| HTTP e REST | 22 | 10 |
| POO, SOLID e Clean Code | 21 | 11 |
| Testes | 27 | 14 |
| Algoritmos e Estruturas de Dados | 20 | 11 |
| **Total** | **241** | **130** |
<!-- /gerado:temas -->

</details>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./docs/readme/grafico-trilhas-escuro.svg">
  <img src="./docs/readme/grafico-trilhas-claro.svg" width="880" alt="Gráfico de barras: tópicos de cada trilha por prioridade, com itens de checklist e links">
</picture>

<details>
<summary>Tabela: trilhas, tópicos, itens e links</summary>

<br>

<!-- gerado:trilhas -->
| Trilha | Tópicos | Alta · média · baixa | Itens de checklist | Links |
|---|---:|:---:|---:|---:|
| Núcleo Comum | 8 | 7 · 1 · 0 | 65 | 31 |
| Front-end | 10 | 8 · 1 · 1 | 72 | 36 |
| Back-end | 8 | 5 · 3 · 0 | 56 | 31 |
| Fullstack | 6 | 3 · 3 · 0 | 32 | 20 |
| **Total** | **32** | | **225** | **118** |
<!-- /gerado:trilhas -->

</details>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./docs/readme/grafico-desafios-escuro.svg">
  <img src="./docs/readme/grafico-desafios-claro.svg" width="880" alt="Gráfico de barras: tempo sugerido de cada um dos 17 desafios de simulado, por área, com formato e gabarito">
</picture>

<details>
<summary>Tabela: os desafios de simulado</summary>

<br>

<!-- gerado:desafios -->
| Desafio | Área | Formato | Nível | Tempo | Gabarito |
|---|---|---|---|---:|:---:|
| Buscador de CEP com histórico | Front-end | Desafio para casa | básico | 1h30 | — |
| Catálogo de Pokémon com busca, filtro e paginação | Front-end | Desafio para casa | intermediário | 3h | — |
| Quadro Kanban com persistência | Front-end | Desafio para casa | intermediário | 3h | — |
| Cadastro em etapas com validação acessível | Front-end | Desafio para casa | básico | 2h | — |
| Explorador de usuários do GitHub | Front-end | Desafio para casa | intermediário | 2h30 | — |
| API de transações e estatísticas em memória | Back-end | Desafio para casa | básico | 2h30 | ✓ |
| API de transferências simplificada | Back-end | Desafio para casa | intermediário | 4h | — |
| Encurtador de URLs | Back-end | Desafio para casa | básico | 2h | — |
| API de pedidos com baixa de estoque | Back-end | Desafio para casa | intermediário | 3h | — |
| Relatório de vendas a partir de CSV em Java puro | Back-end | Prova prática | básico | 1h30 | ✓ |
| Clientes e contatos 1:N | Fullstack | Desafio para casa | intermediário | 4h | — |
| Controle financeiro pessoal | Fullstack | Desafio para casa | intermediário | 4h | — |
| Enquetes com votação e resultados | Fullstack | Desafio para casa | avançado | 4h | — |
| Consultas SQL de um e-commerce | Núcleo comum | Prova prática | básico | 1h | ✓ |
| Live coding: validador de senha com TDD | Núcleo comum | Live coding | básico | 45 min | ✓ |
| Live coding: agrupar e ranquear pedidos | Núcleo comum | Live coding | básico | 40 min | ✓ |
| Code review: encontre os problemas | Núcleo comum | Code review | intermediário | 40 min | ✓ |
<!-- /gerado:desafios -->

</details>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./docs/readme/grafico-recursos-escuro.svg">
  <img src="./docs/readme/grafico-recursos-claro.svg" width="880" alt="Gráfico de barras empilhadas: links gratuitos por categoria e idioma">
</picture>

<details>
<summary>Tabela: recursos por categoria e idioma</summary>

<br>

<!-- gerado:recursos -->
| Categoria | Links | Inglês | Português | Português (PT) |
|---|---:|---:|---:|---:|
| Front-end (HTML, CSS, JS, TS) | 17 | 5 | 12 | — |
| Roadmaps e trilhas | 14 | 12 | 2 | — |
| Spring | 13 | 13 | — | — |
| HTTP, REST e APIs públicas | 13 | 4 | 9 | — |
| Vue e ecossistema | 11 | 10 | — | 1 |
| Testes | 11 | 11 | — | — |
| Prática de algoritmos | 10 | 9 | 1 | — |
| Desafios técnicos reais | 10 | 3 | 7 | — |
| Carreira e comunidade BR | 9 | — | 9 | — |
| SQL e bancos de dados | 7 | 6 | 1 | — |
| Git | 7 | 2 | 5 | — |
| Java | 6 | 5 | 1 | — |
| Clean code e arquitetura | 5 | 3 | 2 | — |
| Docker e DevOps básico | 5 | 5 | — | — |
<!-- /gerado:recursos -->

</details>

## Como funciona

### Arquitetura

Uma página só (`index.html`) carrega `js/app.js`, que lê o conteúdo de `data/*.json`, guarda o progresso no `localStorage` e monta a página da rota atual (`#/pagina?parametros`). Não há servidor de aplicação: o `serve` do `start.bat` só entrega arquivos.

```mermaid
flowchart LR
  accTitle: Arquitetura do Rumo ao Júnior
  accDescr: O navegador carrega index.html e js/app.js. O app lê os arquivos de conteúdo por fetch, guarda o progresso no localStorage, monta uma página por rota e exporta ou importa o backup em JSON.
  subgraph nav [Navegador]
    html["index.html<br/>menu, main, diálogos"] --> app["js/app.js<br/>rotas #/pagina · menu · tema<br/>indicadores · título da aba"]
    app --> pags["js/paginas/*<br/>uma página por rota<br/>montar(el, ctx) → limpar()"]
    app --> core["js/core<br/>estado · dados · backup"]
    pags --> core
    pags --> lib["js/lib<br/>sm2 · timers · estatisticas<br/>ui · dom · datas · som"]
  end
  json[("data/*.json<br/>conteúdo editável")] -- "fetch + validação" --> core
  core <-- "grava a cada atualizar()" --> ls[("localStorage<br/>rumo-junior:estado")]
  core <-- "Exportar / Importar" --> bkp[/"rumo-ao-junior-backup-AAAA-MM-DD.json"/]
  classDef arquivo fill:#fdf1d6,stroke:#a86b00,color:#111110
  classDef guardado fill:#e5eefa,stroke:#256abf,color:#111110
  class json,bkp arquivo
  class ls guardado
```

### Do duplo clique ao app aberto

```mermaid
sequenceDiagram
  accTitle: Do start.bat ao app aberto
  accDescr: O start.bat confere o Node, vê se o app já responde na porta 3000, sobe o serve se precisar e abre o navegador. O navegador carrega index.html e js/app.js, que busca os arquivos de conteúdo.
  actor voce as Você
  participant bat as start.bat
  participant serve as serve (Node)
  participant nav as Navegador
  participant app as js/app.js
  voce->>bat: dois cliques (ou .\start.bat app)
  bat->>bat: confere o Node · menu [1]–[5] · 8 s
  bat->>bat: http://localhost:3000 já responde com o app?
  alt já está aberto
    bat->>nav: abre http://localhost:3000
  else porta livre
    bat->>serve: serve -l 3000 --no-port-switching .
    bat-->>nav: um PowerShell oculto espera o servidor e abre a URL
  end
  nav->>serve: GET index.html, css/, js/
  nav->>app: carrega o módulo
  app->>serve: fetch dos 6 arquivos de data/ em paralelo
  app->>nav: tema, menu e #/dashboard
```

### Como as páginas conversam

As páginas não guardam nada sozinhas: todas leem e gravam o mesmo estado. É assim que uma ação numa página aparece em outra.

```mermaid
flowchart LR
  accTitle: Integrações entre as páginas
  accDescr: O Cronograma alimenta a próxima tarefa do Painel. Quiz e Diário criam flashcards. Pomodoro e Simulado registram horas que aparecem no Painel. O Simulado pausa o Pomodoro e copia o que melhorar para o Diário.
  cron["Cronograma"] -- "próxima tarefa" --> painel["Painel"]
  painel -- "Concluir" --> cron
  cron -- "botão da tarefa" --> destino["Flashcards · Trilhas · Quiz<br/>Simulado · Diário"]
  painel -- "Focar com Pomodoro" --> pomo["Pomodoro"]
  cron -- "Focar" --> pomo
  quiz["Quiz"] -- "Transformar em flashcard<br/>Criar flashcards dos erros" --> flash["Flashcards"]
  diario["Diário"] -- "o difícil vira flashcard" --> flash
  sim["Simulado"] -- "pausa ao começar" --> pomo
  sim -- "copia o que melhorar" --> diario
  pomo -- "sessões" --> horas[("horas estudadas")]
  sim -- "sessões" --> horas
  horas --> painel
  quiz -- "pontos fracos" --> painel
  flash -- "revisões de hoje" --> painel
  trilhas["Trilhas"] -- "progresso" --> painel
  classDef dado fill:#e5eefa,stroke:#256abf,color:#111110
  class horas dado
```

<details>
<summary><strong>O estado:</strong> como uma alteração é salva e chega às páginas</summary>

<br>

Tudo fica num único objeto em `localStorage['rumo-junior:estado']` (esquema completo no topo de `js/core/estado.js`). Cada alteração passa por `atualizar(alteração, motivo)`, que salva e avisa quem está ouvindo. Os motivos que vêm da digitação (`nota`, `pomodoro-rotulo`, `simulado-notas`) não re-renderizam a página, para o cursor não pular.

```mermaid
sequenceDiagram
  accTitle: Fluxo do estado
  accDescr: Uma página chama atualizar, o estado salva no localStorage e avisa os ouvintes, que re-renderizam. Outra aba recebe o evento storage e remonta a página.
  participant pag as Página
  participant est as core/estado.js
  participant ls as localStorage
  participant ouv as Ouvintes (app.js e página)
  participant aba as Outra aba
  pag->>est: atualizar(alteração, motivo)
  est->>est: aplica a alteração
  est->>ls: setItem("rumo-junior:estado", JSON)
  est->>ouv: avisa (estado, motivo)
  ouv->>ouv: contadores e indicadores · re-renderiza, exceto nos motivos de digitação
  ls-->>aba: evento storage
  aba->>aba: recarrega o estado, sincroniza os timers e remonta a página
```

</details>

### Repetição espaçada (SM-2)

Os botões dão notas do SM-2: **Errei = 1**, **Difícil = 3**, **Bom = 4** e **Fácil = 5**. O código está em `js/lib/sm2.js`, com a referência ao texto original.

```mermaid
flowchart TD
  accTitle: Fluxo de uma revisão no SM-2
  accDescr: Você vê a pergunta, revela a resposta e dá uma nota. Errei recomeça o cartão. As outras notas atualizam o fator de facilidade e o intervalo. Notas abaixo de 4 mandam o cartão para o fim da fila do dia, como reforço.
  perg["Pergunta"] -- "Espaço" --> resp["Resposta"]
  resp --> nota{"Nota"}
  nota -- "Errei (1)" --> zera["recomeça: intervalo de 1 dia<br/>fator de facilidade mantido"]
  nota -- "Difícil (3) · Bom (4) · Fácil (5)" --> fator["novo fator = máx(1,3; EF + 0,1 − (5 − q)(0,08 + (5 − q) × 0,02))"]
  fator --> interv["intervalo: 1 dia → 6 dias →<br/>anterior × fator, arredondado para cima"]
  zera --> reforco{"nota menor que 4?"}
  interv --> reforco
  reforco -- "sim: Errei ou Difícil" --> fim["volta no fim da fila de hoje como Reforço<br/>(o reforço não muda o agendamento)"]
  reforco -- "não" --> sai["sai da fila de hoje"]
```

O gráfico abaixo roda essa mesma função (`revisar()` de `js/lib/sm2.js`) para um cartão respondido sempre com a mesma nota. Com **Bom**, os intervalos são de <!-- n:sm2-bom -->1, 6, 15, 38, 95<!-- /n --> dias.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./docs/readme/grafico-sm2-escuro.svg">
  <img src="./docs/readme/grafico-sm2-claro.svg" width="880" alt="Linha do tempo: dias de revisão de um cartão respondido sempre Fácil, sempre Bom, sempre Difícil e Bom com um Errei, calculados pelo sm2.js do app">
</picture>

<details>
<summary>Tabela: dias de revisão nos primeiros 180 dias</summary>

<br>

<!-- gerado:sm2 -->
| Respondendo sempre… | Revisões nos dias (até o dia 180) |
|---|---|
| Sempre Fácil | 1, 7, 24, 74 |
| Sempre Bom | 1, 7, 22, 60, 155 |
| Sempre Difícil | 1, 7, 20, 46, 93, 172 |
| Bom, com um Errei | 1, 7, 22, 23, 24, 30, 45, 83, 178 |
<!-- /gerado:sm2 -->

</details>

### Cronômetros que continuam entre páginas

O Pomodoro e o Simulado guardam no estado o horário em que terminam (`fimEm`), e não um contador. Por isso sobrevivem à troca de página, à aba em segundo plano e ao `F5`: ao reabrir, o que venceu com o app fechado é encerrado e registrado.

```mermaid
stateDiagram-v2
  accTitle: Máquina de estados do Simulado
  accDescr: Sem simulado, Começar agora leva a Rodando. Rodando e Pausado se alternam. Terminei ou o tempo esgotado levam a Avaliando. Salvar avaliação grava no histórico. Desistir ou Descartar voltam a Sem simulado sem registrar nada.
  state "Sem simulado" as nenhum
  state "Rodando" as rodando
  state "Pausado" as pausado
  state "Avaliando" as avaliando
  [*] --> nenhum
  nenhum --> rodando: Começar agora (pausa o Pomodoro, se estiver rodando)
  rodando --> pausado: Pausar
  pausado --> rodando: Retomar
  rodando --> avaliando: Terminei — avaliar
  pausado --> avaliando: Terminei — avaliar
  rodando --> avaliando: tempo esgotado
  rodando --> nenhum: Desistir
  pausado --> nenhum: Desistir
  avaliando --> nenhum: Salvar avaliação (histórico e, se marcado, horas e diário)
  avaliando --> nenhum: Descartar sem salvar
```

<details>
<summary><strong>A máquina de estados do Pomodoro</strong></summary>

<br>

```mermaid
stateDiagram-v2
  accTitle: Máquina de estados do Pomodoro
  accDescr: Iniciar foco leva a Foco rodando. Foco e pausa podem ser pausados e retomados. No fim do foco, a sessão é registrada e a pausa começa sozinha ou fica pronta. Pular no foco registra os minutos inteiros. No fim da pausa, o foco fica pronto.
  state "Ocioso" as ocioso
  state "Foco pronto" as focoPronto
  state "Foco rodando" as foco
  state "Foco pausado" as focoPausado
  state "Pausa pronta" as pausaPronta
  state "Pausa rodando" as pausa
  state "Pausa pausada" as pausaPausada
  state fimFoco <<choice>>
  [*] --> ocioso
  ocioso --> foco: Iniciar foco
  focoPronto --> foco: Iniciar foco
  foco --> focoPausado: Pausar (ou um simulado começou)
  focoPausado --> foco: Retomar
  foco --> fimFoco: tempo esgotado (registra a sessão)
  fimFoco --> pausa: pausa automática ligada
  fimFoco --> pausaPronta: pausa automática desligada
  foco --> pausaPronta: Pular (registra os minutos inteiros)
  focoPausado --> pausaPronta: Pular (registra os minutos inteiros)
  pausaPronta --> pausa: Iniciar pausa
  pausa --> pausaPausada: Pausar
  pausaPausada --> pausa: Retomar
  pausa --> focoPronto: tempo esgotado ou Pular
  pausaPronta --> focoPronto: Pular
  note right of ocioso
    Zerar volta ao Ocioso de qualquer estado.
    A pausa longa vem a cada 4 focos (ajustável).
  end note
```

</details>

### Validação do conteúdo

Você pode editar os JSON à mão: o app confere cada arquivo quando carrega e nunca para por causa de um erro.

```mermaid
flowchart TD
  accTitle: Carga e validação dos arquivos de dados
  accDescr: Cada arquivo é baixado e lido. Arquivo ausente ou JSON inválido vira um erro com a linha e a coluna. Itens incompletos são ignorados com um aviso. Erros aparecem numa faixa no topo, e o resto do app continua funcionando.
  f["fetch de data/*.json<br/>em paralelo, sem cache"] --> st{"respondeu?"}
  st -- "não" --> e1["erro: o arquivo respondeu com status N"]
  st -- "sim" --> js{"JSON válido?"}
  js -- "não" --> e2["erro: JSON inválido em data/x.json<br/>(linha L, coluna C)"]
  js -- "sim" --> val["validador do arquivo"]
  val --> item{"item completo?"}
  item -- "não" --> av["item ignorado + aviso<br/>(id duplicado também avisa)"]
  item -- "sim" --> ok["conteúdo pronto para as páginas"]
  e1 --> faixa["faixa no topo de todas as páginas<br/>as outras continuam funcionando"]
  e2 --> faixa
  faixa --> ajustes["Ajustes → Conteúdo carregado"]
  av --> ajustes
```

<details>
<summary><strong>Importar um backup</strong>, passo a passo</summary>

<br>

```mermaid
sequenceDiagram
  accTitle: Importação de backup
  accDescr: O arquivo é lido e validado. Se for inválido, o progresso atual não é tocado. Se for válido, o app pede confirmação, substitui o estado, sincroniza os cronômetros e recarrega a página.
  actor voce as Você
  participant bk as core/backup.js
  participant est as core/estado.js
  participant app as js/app.js
  voce->>bk: Importar e escolhe o .json
  bk->>bk: lê o arquivo e faz JSON.parse
  bk->>est: validarBackup(objeto)
  alt não é JSON ou não é um backup do app
    bk-->>voce: "Não foi possível importar", progresso intacto
  else válido
    bk->>voce: "Importar backup?" (o atual será substituído)
    alt Cancelar
      bk-->>voce: nada muda
    else Substituir e importar
      bk->>est: restaura o estado
      bk->>app: sincroniza os cronômetros e recarrega a página
      bk-->>voce: "Backup importado com sucesso."
    end
  end
```

</details>

<details>
<summary><strong>Todos os caminhos do <code>start.bat</code></strong></summary>

<br>

```mermaid
flowchart TD
  accTitle: Fluxo do start.bat
  accDescr: O start.bat lê o argumento. manual abre o manual sem precisar de Node. As outras opções exigem o Node. Sem argumento, mostra o menu. app verifica a porta e sobe o servidor. testes, ui e relatorio preparam as dependências e chamam o Playwright.
  ini(["start.bat [app | testes | ui | relatorio | manual]"]) --> arg{"argumento"}
  arg -- "manual" --> man{"manual/index.html existe?"}
  man -- "sim" --> manok["abre o manual no navegador"]
  man -- "não" --> manerr["[ERRO] manual não encontrado"]
  arg -- "outros" --> node{"Node instalado?"}
  node -- "não" --> semnode["[ERRO] instale o Node LTS<br/>(o manual.bat abre sem Node)"]
  node -- "sim" --> opc{"qual opção?"}
  opc -- "nenhuma" --> menu["menu [1]–[5]<br/>abre o app em 8 s"]
  menu -- "1" --> appq
  menu -- "2 · 3 · 4" --> prep
  menu -- "5" --> man
  opc -- "app" --> appq{"a porta já responde?"}
  appq -- "com o app" --> abre["só abre o navegador"]
  appq -- "com outro programa" --> ocupada["[ERRO] porta ocupada"]
  appq -- "não" --> serve["serve -l PORTA · abre o navegador<br/>quando o servidor responder"]
  opc -- "testes · ui · relatorio" --> prep["instala as dependências na 1ª vez"]
  prep --> pw["npx playwright test · --ui · show-report"]
  opc -- "desconhecida" --> uso["mostra o uso correto"]
```

</details>

## Qualidade: testes e acessibilidade

A pasta `testes/` tem uma suíte de ponta a ponta com **Playwright**, que roda no Google Chrome já instalado. Na última execução, em <!-- n:testes-data -->23/09/2026<!-- /n -->, foram <!-- n:testes-total -->159<!-- /n --> testes em <!-- n:testes-projetos -->3<!-- /n --> projetos (desktop, celular e tema escuro): <!-- n:testes-aprovados -->156<!-- /n --> aprovados, <!-- n:testes-pulados -->3<!-- /n --> pulados de propósito (valem só para um tipo de tela) e <!-- n:testes-falharam -->0<!-- /n --> com falha, em <!-- n:testes-duracao -->5 min<!-- /n -->.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./docs/readme/grafico-testes-escuro.svg">
  <img src="./docs/readme/grafico-testes-claro.svg" width="880" alt="Gráfico de barras: testes de cada arquivo da suíte e o resultado da última execução">
</picture>

<details>
<summary>Tabela: testes por arquivo</summary>

<br>

<!-- gerado:testes -->
| Arquivo | Área | Testes | Aprovados | Pulados | Falharam |
|---|---|---:|---:|---:|---:|
| `e2e/acessibilidade.spec.ts` | Acessibilidade (axe-core) | 48 | 46 | 2 | 0 |
| `e2e/manual.spec.ts` | Manual de uso | 24 | 24 | 0 | 0 |
| `e2e/rotina.spec.ts` | Simulado, Pomodoro, Diário e mais | 19 | 19 | 0 | 0 |
| `e2e/responsivo.spec.ts` | Responsividade | 16 | 16 | 0 | 0 |
| `e2e/navegacao.spec.ts` | Navegação | 14 | 13 | 1 | 0 |
| `e2e/plano.spec.ts` | Painel, Trilhas e Cronograma | 12 | 12 | 0 | 0 |
| `e2e/pratica.spec.ts` | Flashcards e Quiz | 12 | 12 | 0 | 0 |
| `e2e/visual.spec.ts` | Capturas de cada tela | 6 | 6 | 0 | 0 |
| `e2e/dados.spec.ts` | JSON editado à mão | 5 | 5 | 0 | 0 |
| `e2e/readme.spec.ts` | README em dia com os dados | 3 | 3 | 0 | 0 |
| **Total** | desktop, celular, escuro | **159** | **156** | **3** | **0** |
<!-- /gerado:testes -->

</details>

O que a suíte garante:

- **Nenhum erro no console:** qualquer erro ou aviso do navegador reprova o teste.
- **Tempo simulado:** o relógio do Playwright (`page.clock`) testa um Pomodoro de 25 minutos ou um simulado de 90 em segundos.
- **Acessibilidade automática:** o **axe-core** confere as regras WCAG 2.1 e 2.2 nível AA em todas as páginas e em estados interativos (flashcard revelado, questão respondida, simulado rodando, diálogo aberto).
- **Teclado e foco:** o contorno de foco aparece em toda a navegação por `Tab`, e o diálogo fecha com `Esc` devolvendo o foco a quem o abriu.
- **Responsividade:** sem rolagem horizontal de 320 a 1440 px e alvos de toque com pelo menos 24 × 24 px.
- **Dados editados à mão:** JSON quebrado mostra arquivo, linha e coluna; itens inválidos e ids duplicados geram aviso; HTML no conteúdo aparece como texto (sem injeção de script).

Acessibilidade no app, além dos testes: HTML semântico com um `h1` por página, link "Pular para o conteúdo", foco no título ao trocar de página, diálogos nativos (`<dialog>`), status sempre com **ícone e texto** (nunca só cor), tabela equivalente em cada gráfico ("Ver como tabela") e respeito a `prefers-reduced-motion` e `prefers-color-scheme`.

```bash
cd testes
npm install              # só na primeira vez
npm test                 # roda tudo (o servidor sobe sozinho)
npm run test:ui          # modo interativo: veja cada passo
npm run relatorio        # relatório HTML da última execução
```

## Guia de uso rápido

<details>
<summary><strong>Atalhos de teclado</strong></summary>

<br>

| Onde | Tecla | O que faz |
|---|---|---|
| Flashcards | `Espaço` ou `Enter` | Mostra a resposta |
| Flashcards | `1` `2` `3` `4` | Errei, Difícil, Bom, Fácil |
| Quiz | `1` a `4` | Escolhe a alternativa |
| Quiz (treino) | `Enter` | Responde |
| Diário | `Ctrl+Enter` | Salva |
| Diálogos | `Esc` | Fecha sem salvar |
| Menu no celular | `Esc` | Fecha o menu |
| Qualquer página | `Tab` no início | Mostra "Pular para o conteúdo" |

</details>

<details>
<summary><strong>Regras do app</strong> (sequência, pontos fracos, cartões novos, onde ficam os dados)</summary>

<br>

- **Sequência de dias:** conta os dias seguidos com alguma ação de estudo — marcar um item ou uma tarefa, avaliar um flashcard, responder uma questão, criar o diário do dia, registrar tempo (Pomodoro, manual ou simulado) ou salvar a avaliação de um simulado. Se você ainda não estudou hoje, a sequência de ontem vale até o fim do dia.
- **Progresso geral:** itens de checklist mais tarefas do cronograma que você marcou, sobre o total (<!-- n:itens-progresso -->349<!-- /n -->).
- **Cartões novos:** <!-- n:novos-por-dia -->15<!-- /n --> por dia por padrão (de 0 a 100, em Ajustes), intercalando os temas. No fim da fila dá para estudar mais 10.
- **Pontos fracos:** as últimas 20 respostas de cada tema, a partir de 5. Abaixo de 60% é ponto fraco; de 60% a 79%, atenção.
- **Horas da semana:** Pomodoro, registros manuais e simulados, de segunda a domingo.
- **Onde ficam os dados:** no `localStorage` do navegador, separado por endereço. `localhost:3000` e `127.0.0.1:5500` guardam progressos diferentes. Para trocar de computador ou de endereço, exporte e importe o backup.

</details>

<details>
<summary><strong>Backup do progresso</strong></summary>

<br>

O progresso (checklists, cronograma, flashcards, quiz, simulados, sessões e diário) fica no **localStorage** deste navegador, **neste endereço**. Ele se perde se você limpar os dados do site ou usar uma janela anônima.

- **Exportar:** clique em **Exportar**, no rodapé do menu (ou em Ajustes). O navegador baixa `rumo-ao-junior-backup-AAAA-MM-DD.json`. Guarde numa nuvem. O Painel avisa quando você nunca exportou ou o último backup tem 7 dias ou mais.
- **Importar:** clique em **Importar** e escolha o arquivo. O app confere se é um backup válido e pede confirmação, porque a importação **substitui** o progresso atual. Um arquivo inválido é recusado sem mexer em nada.
- **Recomeçar do zero:** Ajustes → Zona de perigo → **Apagar todo o progresso**. Exporte antes.

</details>

<details>
<summary><strong>Solução de problemas</strong></summary>

<br>

| Sintoma | Causa provável e solução |
|---|---|
| Aparece "Abra pelo servidor local" ou a página fica em "Carregando…" | A página foi aberta com duplo clique (`file://`). Use o `start.bat`. |
| Editei um JSON e nada mudou | Recarregue com `Ctrl+F5` e veja se apareceu uma faixa vermelha de JSON inválido no topo. |
| Meu progresso sumiu | Você abriu por outro endereço ou porta, ou limpou os dados do navegador. Volte ao endereço de sempre ou importe o último backup. |
| O alarme do Pomodoro não tocou | O navegador só libera som depois de um clique na página. Clique em "Iniciar" pelo menos uma vez; com a aba em segundo plano, ative a notificação em Pomodoro → Configurações do timer. O tempo registrado continua exato. |
| O `start.bat` diz que o Node não foi encontrado | Instale o Node.js LTS e reabra o VS Code. Sem o Node, o `manual.bat` ainda abre o manual. |
| O `start.bat` diz que a porta 3000 está ocupada | Feche o outro programa ou use outra porta (`$env:PORTA=3001`). Outro endereço guarda outro progresso. |
| `start.bat` não é reconhecido no terminal | No PowerShell, escreva `.\start.bat`. |

</details>

<details>
<summary><strong>Limitações conhecidas</strong></summary>

<br>

- Um quiz em andamento fica só na memória: recarregar a página (`F5`) perde a rodada. Pomodoro e simulado sobrevivem ao `F5`.
- Começar um simulado pausa o Pomodoro, mas nada o retoma no fim: use **Retomar**.
- "Focar com Pomodoro" (Painel) e "Focar" (Cronograma) reiniciam o foco em curso sem registrar os minutos parciais; **Pular** e **Zerar** registram.
- O SM-2 usa o intervalo anterior, não os dias reais desde a última revisão: revisar com atraso não muda a conta.
- O progresso não sincroniza entre computadores: use o backup.

</details>

## Editar ou adicionar conteúdo

Depois de salvar um arquivo em `data/`, recarregue a página com `F5` (ou `Ctrl+F5`). O Live Server recarrega sozinho. Se algo estiver errado, o app mostra o arquivo e a linha, e as outras páginas continuam funcionando.

<details>
<summary><strong>Regras de ouro do JSON</strong> e mini-markdown dos textos</summary>

<br>

- **Formato:** aspas **duplas** em chaves e textos; vírgula entre os itens e **nenhuma** depois do último; sem comentários; aspas dentro de um texto como `\"` e quebra de linha como `\n`.
- **Ids:** todo item tem um `id` **único**. **Não mude o `id` de um item que você já estudou**: o progresso está ligado ao id. Para corrigir um texto, altere só o texto.
- **Erros:** JSON com erro de sintaxe mostra uma faixa vermelha com **arquivo, linha e coluna**. Itens incompletos (por exemplo, uma questão sem `correta`) são ignorados e listados em **Ajustes → Conteúdo carregado**.
- **Dica:** o VS Code marca erros de JSON enquanto você digita; `Shift+Alt+F` formata o arquivo.

Os campos de texto (perguntas, respostas, enunciados, descrições) aceitam:

| Escreva | Para obter |
|---|---|
| `` `codigo` `` | código na linha |
| `**negrito**` | **negrito** |
| linhas começando com `- ` | lista |
| `\n` | quebra de linha (`\n\n` separa parágrafos) |
| ` ```java\n...\n``` ` | bloco de código, com a linguagem opcional |

Tags HTML não funcionam: por segurança, aparecem como texto.

</details>

<details>
<summary><strong>Flashcards</strong> (<code>data/flashcards.json</code>) e <strong>quiz</strong> (<code>data/quiz.json</code>)</summary>

<br>

Temas disponíveis (use o `id`): `js-ts`, `vue`, `html-css`, `java`, `spring`, `sql`, `git`, `http`, `oop`, `testes`, `algoritmos`. Para criar um tema, adicione `{ "id": "angular", "nome": "Angular" }` em `"temas"`.

```json
{
  "id": "spring-030",
  "tema": "spring",
  "pergunta": "Para que serve o `@Transactional`?",
  "resposta": "Abre uma transação no início do método e faz **commit** no fim — ou **rollback** se sair uma exceção não verificada.\nUse na camada de service."
}
```

Cartões criados pelo app (Flashcards → **Novo cartão**) ficam no seu progresso, entram no backup e não alteram o JSON.

```json
{
  "id": "q-sql-013",
  "tema": "sql",
  "enunciado": "Qual cláusula filtra **grupos** depois do `GROUP BY`?",
  "alternativas": ["`WHERE`", "`HAVING`", "`ORDER BY`", "`LIMIT`"],
  "correta": 1,
  "explicacao": "`HAVING` filtra depois da agregação; `WHERE` filtra linhas antes dela."
}
```

`correta` é o **índice** da alternativa certa, **começando em 0**. O app embaralha as alternativas, então não use "todas as anteriores", "A e B" nem letras.

</details>

<details>
<summary><strong>Desafios</strong> (<code>data/desafios.json</code>), <strong>trilhas</strong>, <strong>cronograma</strong> e <strong>recursos</strong></summary>

<br>

```json
{
  "id": "back-todo",
  "titulo": "API de tarefas com filtros",
  "area": "back",
  "formato": "take-home",
  "nivel": "básico",
  "tempoSugeridoMin": 120,
  "stack": ["Java 21", "Spring Boot 3"],
  "resumo": "Uma frase para o card da lista.",
  "contexto": "Texto da empresa (fictícia).",
  "enunciado": "O que construir (aceita mini-markdown).",
  "requisitos": ["Requisito obrigatório 1", "Requisito 2"],
  "diferenciais": ["Bônus 1"],
  "criterios": ["Critério verificável 1 (vira checklist na autoavaliação)"],
  "entrega": "Repositório público com README.",
  "dicas": ["Dica 1"],
  "gabarito": "(opcional) solução de referência, mostrada só quando você pede",
  "inspiracao": [{ "titulo": "Desafio real", "url": "https://..." }]
}
```

- **`area`:** `front`, `back`, `fullstack` ou `comum`. **`formato`:** `take-home`, `live-coding`, `prova-pratica` ou `code-review`. **`nivel`:** texto livre (ex.: `básico`, `intermediário`, `avançado`).
- **Trilhas** (`data/trilhas.json`): cada tópico tem `id`, `titulo`, `descricao`, `prioridade` (`alta`, `media` ou `baixa`), `links` (`{ "titulo", "url", "idioma" }`) e `checklist` (`{ "id", "texto" }`). Os ids do checklist precisam ser únicos em **todas** as trilhas.
- **Cronograma** (`data/cronograma.json`): `semanas` → `dias` → `tarefas`. Cada tarefa tem `id`, `tipo` (`algoritmo`, `estudo`, `projeto`, `revisao`, `simulado` ou `descanso`), `duracao` em minutos, `titulo`, `descricao`, `links` (opcional) e `acao` (opcional): `{ "rotulo": "Abrir quiz", "rota": "#/quiz?tema=sql&modo=treino&qtd=10" }`. As datas não ficam no JSON: o app calcula a partir da **data de início** (Dia 1).
- **Recursos** (`data/recursos.json`): `categorias` → `links`, cada link com `{ "titulo", "url", "idioma", "descricao" }`; `idioma` pode ser `pt-BR`, `pt-PT`, `en` ou `multi`.

Rotas úteis para a `acao` de uma tarefa:

| Rota | Abre |
|---|---|
| `#/quiz?tema=misto&modo=prova&qtd=20` | quiz pré-configurado (`modo`: `treino` ou `prova`; `qtd`: número ou `todas`) |
| `#/flashcards?tema=git` | fila de flashcards filtrada por tema (`&aba=lista` abre a lista) |
| `#/simulado?desafio=front-cep` | um desafio específico |
| `#/trilhas?trilha=back&topico=back-jpa` | um tópico de uma trilha |
| `#/cronograma?semana=3` | uma semana do plano |
| `#/diario`, `#/pomodoro`, `#/dashboard` | as páginas correspondentes |

</details>

## Estrutura das pastas

<details>
<summary>Ver a árvore do projeto</summary>

<br>

```
prova/
├── start.bat             # duplo clique: sobe o servidor e abre o app (ou roda os testes)
├── manual.bat            # duplo clique: abre o manual de uso (sem Node)
├── index.html            # página única (as rotas usam #/pagina)
├── README.md
├── css/                  # base (temas), layout, componentes, páginas
├── js/
│   ├── app.js            # inicialização, rotas, menu, tema, indicadores dos cronômetros
│   ├── core/             # estado.js (localStorage), dados.js (carga e validação), backup.js
│   ├── lib/              # sm2, timers, estatisticas, ui, dom, datas, som
│   └── paginas/          # um módulo por página
├── data/                 # CONTEÚDO editável: trilhas, cronograma, flashcards, quiz, desafios, recursos
├── docs/
│   ├── pesquisa.md       # a pesquisa, com todas as fontes
│   └── readme/           # visuais deste README (gerados) e dados/ (resumos usados neles)
├── manual/               # manual de uso ilustrado (index.html + img/)
└── testes/               # opcional: Playwright
    ├── playwright.config.ts
    ├── e2e/              # navegação, fluxos, acessibilidade, responsividade, dados, manual
    ├── manual/           # roteiro dos prints do manual
    └── readme/           # gerador dos gráficos e roteiro das demonstrações deste README
```

</details>

## Pesquisa e fontes

O arquivo [`docs/pesquisa.md`](./docs/pesquisa.md) reúne o que costuma cair em provas técnicas de Dev Júnior no Brasil (formatos, critérios publicados por empresas e temas recorrentes), o que pesa na efetivação de estagiários, as técnicas de estudo com evidência científica (prática de recuperação, prática espaçada, intercalação, simulados) e a lista de fontes. No VS Code, abra o arquivo e use `Ctrl+Shift+V` para ver formatado.

## Como os visuais deste README são gerados

Nada aqui é ilustração ou número digitado à mão:

- **Números e tabelas:** `testes/readme/graficos.mjs` lê `data/*.json` e reescreve os trechos marcados do README. As mesmas contas desenham os gráficos SVG (com versões para tema claro e escuro).
- **Intervalos do SM-2:** saem da função `revisar()` de `js/lib/sm2.js`, a mesma que a página Flashcards usa.
- **Terminal:** o texto é lido do próprio `start.bat`.
- **Demonstrações:** `testes/readme/demos.spec.ts` usa o Playwright para abrir o app real com o progresso zerado, clicar e digitar de verdade, e fotografar cada passo. `testes/readme/filme.ts` junta os quadros num SVG animado.
- **Testes:** `testes/readme/resumo-testes.mjs` roda a suíte inteira e grava o resultado em `docs/readme/dados/testes.json`, de onde saem o selo, o gráfico e os números da seção de qualidade.
- **Trava:** um teste da suíte falha se o README estiver diferente do que os dados geram.

```bash
cd testes
npm run readme:testes     # roda a suíte e grava o resultado real
npm run readme:graficos   # gráficos, selos, números e tabelas do README
npm run readme:demos      # grava as demonstrações no app real
npm run readme:visuais    # as três coisas, nessa ordem
```

As animações respeitam a opção "reduzir movimento" do sistema e param sozinhas depois de algumas voltas.
