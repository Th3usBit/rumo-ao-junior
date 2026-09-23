# Pesquisa — Prova técnica para Dev Júnior

> Pesquisa feita em **23/09/2026** para orientar este sistema de estudo.
> Todas as afirmações têm link para a fonte. Os links marcados com **(busca)** foram confirmados só pelo resultado de busca (não deu para abrir a página); os demais foram abertos e lidos, ou responderam 200 no teste de link.

## Sumário

1. [Resumo: o que fazer com esta pesquisa](#1-resumo-o-que-fazer-com-esta-pesquisa)
2. [Como são as provas técnicas para Dev Júnior no Brasil](#2-como-são-as-provas-técnicas-para-dev-júnior-no-brasil)
3. [Técnicas de estudo com base em evidências](#3-técnicas-de-estudo-com-base-em-evidências)
4. [Como este sistema aplica a pesquisa](#4-como-este-sistema-aplica-a-pesquisa)
5. [Recursos gratuitos](#5-recursos-gratuitos)
6. [Fontes](#6-fontes)

---

## 1. Resumo: o que fazer com esta pesquisa

- **Primeiro passo: pergunte o formato.** Não há relatos públicos de "prova de efetivação" de estagiário de desenvolvimento, porque cada empresa monta a sua. Pergunte ao RH ou ao seu gestor:
  - se a prova é prática ou teórica;
  - qual stack será cobrada;
  - quanto tempo você terá;
  - se pode consultar material;
  - se haverá entrevista técnica ou apresentação do código.
- **A atitude conta tanto quanto o código.** Numa pesquisa CIEE/Instituto Locomotiva (fev/2026), 84% das empresas disseram valorizar mais a abertura ao aprendizado do que o domínio técnico na hora de efetivar estagiários. Nessa pesquisa, o domínio técnico aparece como requisito básico, e não mais como diferencial. Leve exemplos concretos das suas entregas no estágio, organizados no método STAR ([CIEE/SC](https://cieesc.org.br/blog/efetivacao-de-estagiario/)).
- **O que as empresas avaliam nos desafios práticos:**
  1. requisitos cumpridos exatamente como pedidos (nomes de rotas e campos inclusive);
  2. README que permite rodar o projeto sem ajuda;
  3. código limpo, organizado em camadas ou componentes;
  4. commits pequenos e com significado;
  5. testes, inclusive dos casos de erro;
  6. tratamento de erros;
  7. no front, semântica e responsividade.
- **Como estudar:** as técnicas com evidência mais forte são responder sem consultar (prática de recuperação) e espalhar as revisões no tempo (prática espaçada). Reler e grifar têm baixa utilidade ([Dunlosky et al., 2013](https://doi.org/10.1177/1529100612453266)).
- **Seu diferencial:** a experiência com QA/testes é exatamente o que costuma faltar em testes júnior. O desafio do Itaú avisa que "testar apenas os 'caminhos felizes' não é muito efetivo" ([repositório](https://github.com/rafaellins-itau/desafio-itau-vaga-99-junior)).

---

## 2. Como são as provas técnicas para Dev Júnior no Brasil

### 2.1 Formatos de avaliação

| Formato | Como funciona | Prazo/duração encontrados | O que o avaliador observa |
|---|---|---|---|
| **Desafio para casa (take-home)** | Enunciado com requisitos. Entrega por repositório público, fork com PR ou link por e-mail. A correção é manual. | "Algumas horas" ([Pagnet/BLU](https://github.com/Pagnet/desafio-front-end)); 4 dias ([GOK](https://github.com/gok-dev/desafio-frontend-developer)); 1 semana ([Plataformatec](https://blog.plataformatec.com.br/2016/03/6-dicas-para-mandar-bem-no-codigo-do-processo-seletivo-da-plataformatec/)) | Requisitos, README, commits, testes, organização e segurança |
| **Prova online/teórica** | Questões objetivas (como o "Fast Challenge" da [Coodesh](https://coodesh.com/blog/rh-tech/assessment/veja-como-sua-empresa-pode-aplicar-testes-para-desenvolvedores-junior/)) ou problemas de lógica com correção automática em plataformas como HackerRank e Codility ([GeekHunter](https://www.geekhunter.com/pt/blog/teste-para-desenvolvedor-2/)). Em provas escritas também caem questões abertas de POO, SQL e lógica ([fórum DevMedia](https://www.devmedia.com.br/forum/perguntas-ou-teste-na-contratacao-de-desenvolvedor-junior/542120)). | O cronômetro não para depois de iniciado. Há relato de 2 questões em 110 min no Codility ([Blind](https://www.teamblind.com/post/what-to-expect-for-microsoft-oa-new-grad-jc7zlha7) (busca)). | Casos de teste, inclusive ocultos. O Codility também avalia complexidade ([DevPleno](https://devpleno.com/codility) (busca)) |
| **Live coding** | Você resolve um problema ao vivo, compartilhando a tela. | Não confirmado | "A forma de pensar e quais caminhos o programador é capaz de traçar" ([GeekHunter](https://www.geekhunter.com/pt/blog/live-coding-como-testar-o-desenvolvedor-antes-de-contratar/)). A dica mais repetida é pensar em voz alta ([Lukas de Souza](https://dev.to/lukasdesouza/processo-seletivo-pra-dev-junior-o-que-ninguem-te-conta-2ejj)). |
| **Pair programming** | Você programa em dupla com alguém do time. | 40 min com TDD e troca de papéis a cada 5 min, em problemas de Coding Dojo como algarismos romanos ([Osvaldo Santana](https://osantana.me/bastidores-de-um-processo-seletivo/)) | Como a pessoa pensa e se comporta ao escrever código ([Plataformatec](https://blog.plataformatec.com.br/2016/03/6-dicas-para-mandar-bem-no-codigo-do-processo-seletivo-da-plataformatec/)); colaboração e comunicação |
| **Entrevista técnica** | Perguntas conceituais e perguntas sobre o código que você entregou. | Sessão única | "Eu sempre avalio mais a capacidade de colaborar, como a pessoa formula soluções, e a capacidade de entender requisitos" ([João Marcus](https://joaomarcuslf.com/posts/dicas-de-um-entrevistador-tecnico)) |
| **Code review** | Você revisa ao vivo o código que entregou ([Lucas Santos](https://blog.lsantos.dev/entrevistas-tecnicas/)) ou analisa um trecho dado pelo entrevistador. | Cerca de 20–30 min em relato do QuintoAndar ([Glassdoor](https://www.glassdoor.com.br/Entrevista/QuintoAndar-Software-Engineer-Perguntas-entrevista-EI_IE1161693.0,11_KO12,29.htm) (busca)) | Raciocínio, comunicação e justificativa das decisões |
| **Comportamental/cultural** | Conversa com RH ou gestor; às vezes inclui questionário de perfil ([Coodesh](https://coodesh.com/blog/rh-tech/assessment/veja-como-sua-empresa-pode-aplicar-testes-para-desenvolvedores-junior/)). | Variável | Método STAR e honestidade ([João Marcus](https://joaomarcuslf.com/posts/dicas-de-um-entrevistador-tecnico)). "As questões comportamentais podem ter um peso até maior que as questões técnicas" ([DevMedia](https://www.devmedia.com.br/forum/perguntas-ou-teste-na-contratacao-de-desenvolvedor-junior/542120)) |

### 2.2 Critérios de avaliação publicados por empresas

- **Itaú, vaga júnior (Java/Kotlin + Spring Boot)** ([repositório](https://github.com/rafaellins-itau/desafio-itau-vaga-99-junior)):
  - avaliam "a qualidade do seu código, o quão fácil é de compreender o código, organização do projeto, quantidade e qualidade dos testes, preocupação com segurança";
  - a API guarda tudo em memória (sem banco), com nomes exatos de endpoints e campos, respostas 201/422/400 e pelo menos 3 commits;
  - extras: testes, container, logs, healthcheck, Swagger.
- **PicPay (back-end)** ([repositório](https://github.com/PicPay/picpay-desafio-backend)):
  - competências em níveis: básico (REST, Git, código limpo); intermediário (SOLID, design patterns, Docker, documentação, testes unitários e de integração, banco relacional); avançado (observabilidade, CI/CD, mensageria);
  - a transferência precisa ser uma transação.
- **Loggi (front-end)** ([repositório](https://github.com/loggi/desafio-frontend)):
  - "Documentação — precisamos conseguir rodar o projeto apenas lendo a documentação";
  - HTML "da maneira mais semântica possível", "Mobile first e layout responsivo";
  - histórico de commits e componentização.
- **Pagnet/BLU (front) e CustomerX (fullstack júnior)** ([Pagnet](https://github.com/Pagnet/desafio-front-end), [CustomerX](https://github.com/CustomerX-CX/desafio-fullstack-junior)) usam as mesmas três perguntas:
  1. "Sua aplicação preenche os requerimentos básicos?"
  2. "Você documentou a maneira de configurar o ambiente e rodar sua aplicação?"
  3. "Você seguiu as instruções de envio do desafio?"
- **Rocketseat (front)** ([repositório](https://github.com/Rocketseat/frontend-challenge)): "Gerenciamento de estado, Componentização, Responsividade, Preocupação com usabilidade, Preocupação com acessibilidade, Testes e2e, Padrões de código, Padrão de commits".
- **Outros exemplos:**
  - [GOK](https://github.com/gok-dev/desafio-frontend-developer): código limpo e coeso, testes com cobertura, linter e "README.md bem escrito, curto e com os comandos necessários".
  - [Kinvo](https://github.com/kinvoapp/kinvo-front-end-test): requisitos diferentes por nível; aceita entrega incompleta se você explicar no PR.
  - [Concrete](https://github.com/concretesolutions/recrutamento-fe): rotas obrigatórias, layout responsivo a partir de 320×480, testes e CI.

**O que se repete:**
1. atender aos requisitos à risca;
2. README executável;
3. organização;
4. commits pequenos;
5. testes (inclusive de erro);
6. tratamento de erros;
7. no front, responsividade e semântica;
8. seguir as regras de entrega.

### 2.3 Temas recorrentes

**Núcleo comum:**
- Lógica e estruturas de dados, e complexidade Big-O. O Codility mede complexidade ([DevPleno](https://devpleno.com/codility) (busca)).
- Git: "obrigatório" nas entrevistas relatadas por [Gabriel Bahia](https://dev.to/gabrielsantosba/perguntas-de-entrevistas-para-desenvolvedor-java-junior-7lp).
- SQL (JOINs), HTTP/REST (verbos e status codes) e clean code/SOLID/KISS ([João Marcus](https://joaomarcuslf.com/posts/dicas-de-um-entrevistador-tecnico), [PicPay](https://github.com/PicPay/picpay-desafio-backend)).
- Pirâmide de testes e segurança (SQL Injection, XSS) ([TabNews/jhowzs](https://www.tabnews.com.br/jhowzs/dicas-que-podem-te-salvar-em-uma-entrevista-tecnica), [Rocketseat](https://www.rocketseat.com.br/blog/artigos/post/erros-comuns-programadores-iniciantes)).

**Front-end:**
- HTML semântico (quantos `h1`, `div` vs `span`), SEO e acessibilidade.
- CSS: `position`, box model, mobile first, BEM ([1STi](https://github.com/1STi/desafio-frontend), [Loggi](https://github.com/loggi/desafio-frontend)).
- JavaScript (promises, async/await, closures, `map`/`filter`/`reduce`) e as vantagens do TypeScript ([TabNews/jhowzs](https://www.tabnews.com.br/jhowzs/dicas-que-podem-te-salvar-em-uma-entrevista-tecnica)).
- Funcionalidades mais pedidas em testes de front júnior ([TabNews/joseromary](https://www.tabnews.com.br/joseromary/funcionalidades-mais-exigidas-em-testes-tecnicos-para-devfront-end-jr)):
  - CRUD e consumo de API com fetch ou axios;
  - persistência em localStorage;
  - layout responsivo e rotas;
  - gerenciamento de estado e formulários;
  - busca, filtro e favoritos.
- Vários desafios aceitam Vue ([Concrete](https://github.com/concretesolutions/recrutamento-fe), [Viva Decora](https://github.com/vivadecora/desafio-frontend-jr-trabalhe-conosco)).

**Back-end (Java):**
- Perguntas comuns ([Gabriel Bahia](https://dev.to/gabrielsantosba/perguntas-de-entrevistas-para-desenvolvedor-java-junior-7lp)):
  - `==` vs `equals`, `equals`/`hashCode`, `ArrayList` vs `LinkedList` vs `HashSet`;
  - POO (polimorfismo, herança, encapsulamento, composição);
  - MVC e em que camada fica a regra de negócio;
  - módulos do Spring (Web, Data JPA, Boot, Security);
  - CI/CD.
- Exceções checked vs unchecked ([DevMedia](https://www.devmedia.com.br/diferenca-entre-checked-e-unchecked-exceptions-em-java/28908) (busca)).
- Transações, Docker e Swagger aparecem como requisito ou extra ([PicPay](https://github.com/PicPay/picpay-desafio-backend), [Itaú](https://github.com/rafaellins-itau/desafio-itau-vaga-99-junior)).
- A [FCamara](https://github.com/fcamarasantos/backend-test-java) pede também respostas teóricas no README.

**Fullstack:** CRUD com relacionamento 1:N e relatório ([CustomerX](https://github.com/CustomerX-CX/desafio-fullstack-junior)), README e deploy.

### 2.4 Efetivação de estagiário: o que pesa

- **Pesquisa CIEE/Locomotiva (2026):**
  - disciplina, pontualidade, proatividade, fit cultural, comunicação, adaptabilidade e trabalho em equipe vêm na frente;
  - o domínio técnico passou a ser "requisito básico" ([CIEE/SC](https://cieesc.org.br/blog/efetivacao-de-estagiario/)).
- **Critérios citados para tecnologia:** domínio das linguagens, proatividade na resolução de problemas, qualidade do código e trabalho em equipe. As avaliações costumam ser semestrais, com feedback e PDI ([Grupo Selpe](https://www.gruposelpe.com.br/blog/como-avaliar-um-estagiario/) (busca)).
- **Histórico:** os relatórios semestrais de atividades servem de histórico, e a decisão "deixa de depender de impressão pessoal" ([Estagiarios.com](https://blog.estagiarios.com/efetivacao-de-estagiario-formar-futuro-colaborador/) (busca)).
- **Inferência (não é dado de fonte):** a prova provavelmente confirma um nível mínimo, e a sua trajetória no estágio pesa junto.

### 2.5 Dicas e erros comuns

**Dicas**
1. **Siga o enunciado à risca.**
   - "Se o desafio pede `/create-user`, não use `/createUser`" ([Thalita Marra](https://dev.to/thalimarra/5-dicas-de-como-escrever-um-bom-desafio-tecnico-kj0)).
   - Respeite também as instruções de envio ([Pagnet](https://github.com/Pagnet/desafio-front-end), [CustomerX](https://github.com/CustomerX-CX/desafio-fullstack-junior)).
2. **Escreva um README que funcione sozinho** e teste o passo a passo num clone limpo ([Loggi](https://github.com/loggi/desafio-frontend), [GOK](https://github.com/gok-dev/desafio-frontend-developer)).
3. **Faça commits pequenos** que expliquem "o quê" e "por quê" ([Plataformatec](https://blog.plataformatec.com.br/2016/03/6-dicas-para-mandar-bem-no-codigo-do-processo-seletivo-da-plataformatec/)).
4. **Teste os casos de erro** ([Itaú](https://github.com/rafaellins-itau/desafio-itau-vaga-99-junior)).
5. **Prefira a simplicidade:** "busque a simplicidade" ([Plataformatec](https://blog.plataformatec.com.br/2016/03/6-dicas-para-mandar-bem-no-codigo-do-processo-seletivo-da-plataformatec/)). Domine o básico antes de microsserviços ([Lukas de Souza](https://dev.to/lukasdesouza/processo-seletivo-pra-dev-junior-o-que-ninguem-te-conta-2ejj)).
6. **No live coding:** entenda o problema antes de codar, pense em voz alta e não ignore as dicas do entrevistador ([João Marcus](https://joaomarcuslf.com/posts/dicas-de-um-entrevistador-tecnico)).
7. **Entregue mesmo incompleto** e explique o que faltou ([Kinvo](https://github.com/kinvoapp/kinvo-front-end-test)).
8. **Facilite a vida do avaliador:** por exemplo, resolva o CORS sem exigir extensões ([TabNews/joseromary](https://www.tabnews.com.br/joseromary/funcionalidades-mais-exigidas-em-testes-tecnicos-para-devfront-end-jr)).
9. **Seja honesto:** "Seja honesto e não minta sob nenhum aspecto" ([DevMedia](https://www.devmedia.com.br/forum/perguntas-ou-teste-na-contratacao-de-desenvolvedor-junior/542120)).

**Erros que reprovam**
- Não cumprir os requisitos e copiar código pronto ([Coodesh](https://coodesh.com/blog/candidates/saiba-como-validar-suas-habilidades-com-teste-para-desenvolvedor/)).
- Nomes genéricos, falta de testes e falta de tratamento de erros ([Rocketseat](https://www.rocketseat.com.br/blog/artigos/post/erros-comuns-programadores-iniciantes)).
- Fingir que domina um assunto, complicar demais a solução e começar a codar sem entender o problema ([João Marcus](https://joaomarcuslf.com/posts/dicas-de-um-entrevistador-tecnico)).
- GitHub privado ou Git fraco ([Lukas de Souza](https://dev.to/lukasdesouza/processo-seletivo-pra-dev-junior-o-que-ninguem-te-conta-2ejj)).

### 2.6 Repositórios de desafios reais (confirmados)

| Repositório | O que contém |
|---|---|
| [backend-br/desafios](https://github.com/backend-br/desafios) | 6 desafios de back-end: criptografia, autenticação, empréstimos, senha segura, encurtador de URL, pontos de interesse por GPS |
| [CollabCodeTech/backend-challenges](https://github.com/CollabCodeTech/backend-challenges) | Mais de 80 desafios reais de back-end de empresas |
| [felipefialho/frontend-challenges](https://github.com/felipefialho/frontend-challenges) | Lista de desafios reais de front por empresa (sem atualização desde 05/2024) |
| [PicPay/picpay-desafio-backend](https://github.com/PicPay/picpay-desafio-backend) | API de transferências com critérios em 3 níveis |
| [rafaellins-itau/desafio-itau-vaga-99-junior](https://github.com/rafaellins-itau/desafio-itau-vaga-99-junior) | API REST júnior em Spring Boot: transações e estatísticas |
| [fcamarasantos/backend-test-java](https://github.com/fcamarasantos/backend-test-java) | API de estacionamento com perguntas teóricas |
| [loggi/desafio-frontend](https://github.com/loggi/desafio-frontend) | Rastreamento de pacotes, critérios por senioridade |
| [Pagnet/desafio-front-end](https://github.com/Pagnet/desafio-front-end) | Interface com a PokéAPI |
| [gok-dev/desafio-frontend-developer](https://github.com/gok-dev/desafio-frontend-developer) | Repositórios com estrela e tags |
| [kinvoapp/kinvo-front-end-test](https://github.com/kinvoapp/kinvo-front-end-test) | Requisitos de estágio a sênior |
| [vivadecora/desafio-frontend-jr-trabalhe-conosco](https://github.com/vivadecora/desafio-frontend-jr-trabalhe-conosco) | Jogo da memória (front júnior, aceita Vue) |
| [Rocketseat/frontend-challenge](https://github.com/Rocketseat/frontend-challenge) | E-commerce em Next.js + TypeScript |
| [Apiki/front-end-challenge](https://github.com/Apiki/front-end-challenge) | Blog headless com a API do WordPress |
| [1STi/desafio-frontend](https://github.com/1STi/desafio-frontend) | Previsão do tempo (vaga de estágio) |
| [concretesolutions/recrutamento-fe](https://github.com/concretesolutions/recrutamento-fe) | Busca de usuários do GitHub |
| [Creditas/challenge (front)](https://github.com/Creditas/challenge/tree/master/frontend/individual-assignment) | Refatoração de calculadora em JS puro |
| [CustomerX-CX/desafio-fullstack-junior](https://github.com/CustomerX-CX/desafio-fullstack-junior) | CRUD fullstack de clientes e contatos (1:N) |

---

## 3. Técnicas de estudo com base em evidências

### 3.1 O panorama: Dunlosky et al. (2013)

A revisão *Improving Students' Learning With Effective Learning Techniques* avaliou 10 técnicas ([DOI](https://doi.org/10.1177/1529100612453266) · [PubMed](https://pubmed.ncbi.nlm.nih.gov/26173288/)):

| Utilidade | Técnicas |
|---|---|
| **Alta** | Practice testing (autotestes de baixo risco) e distributed practice (prática espaçada) |
| **Moderada** | Elaborative interrogation, self-explanation (autoexplicação) e interleaved practice (prática intercalada) |
| **Baixa** | Resumir, grifar, mnemônicos de palavra-chave, imagens mentais para texto e reler |

### 3.2 Prática de recuperação (active recall / testing effect)

**O que é:** tentar lembrar a informação sem olhar o material. O ato de lembrar fortalece a memória, em vez de só medi-la.

**Evidências**
- **[Roediger & Karpicke (2006)](https://doi.org/10.1111/j.1467-9280.2006.01693.x), *Psychological Science*:**
  - no teste feito 5 min depois, reestudar venceu;
  - após 2 dias e após 1 semana, quem fez testes lembrou bem mais;
  - quem reestudou se sentia mais confiante, mas lembrou menos.
- **[Karpicke & Blunt (2011)](https://doi.org/10.1126/science.1199327), *Science*:** a prática de recuperação superou os mapas conceituais após 1 semana, inclusive em questões de inferência ([PDF](https://learninglab.psych.purdue.edu/downloads/2011/2011_Karpicke_Blunt_Science.pdf)).
- **Meta-análise de [Adesope et al. (2017)](https://doi.org/10.3102/0034654316689306):** os testes práticos superaram o reestudo e as demais condições de comparação.
- **Em português:** [Oliveira & Stein (PUCRS, 2018)](https://doi.org/10.1590/2175-35392018018540).

**Como aplicar:** flashcards em que a resposta só aparece depois de você tentar; quiz sem consulta; ao fim da sessão, escrever de memória o que aprendeu.

### 3.3 Prática espaçada (spacing effect)

**O que é:** distribuir as revisões ao longo dos dias em vez de concentrar tudo na véspera.

**Evidências**
- **[Ebbinghaus (1885)](http://www.yorku.ca/pclassic/Ebbinghaus/memory8.htm):** "a suitable distribution of them over a space of time is decidedly more advantageous than the massing of them at a single time".
- **Meta-análise de [Cepeda et al. (2006)](https://doi.org/10.1037/0033-2909.132.3.354):** 317 experimentos. O intervalo ótimo entre as sessões cresce conforme aumenta o tempo até a prova.
- **[Cepeda et al. (2008)](https://doi.org/10.1111/j.1467-9280.2008.02209.x):** o intervalo ótimo ficou em torno de 20–40% do prazo até a prova quando o prazo era de 1 semana, e de 5–10% quando era de 1 ano.
- **Em português:** o guia [Como usar a prática de lembrar espaçada](https://pdf.retrievalpractice.org/translations/Portuguese_Spacing.pdf).

**Como aplicar:** com cerca de 6 semanas até a prova, rever cada tópico a cada 4–7 dias parece razoável. Esse número é uma interpolação a partir de Cepeda et al. (2008), não um valor do artigo. Os flashcards usam o SM-2, que calcula o intervalo de cada cartão.

### 3.4 O algoritmo SM-2 (SuperMemo)

**Fonte:** Piotr Wozniak, *Application of a computer to improve the results obtained in working with the SuperMemo method* (1990) ([supermemo.com](https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method)).

1. Divida o conhecimento nos menores itens possíveis.
2. Cada item começa com fator de facilidade **EF = 2,5**.
3. Os intervalos são **I(1) = 1 dia**, **I(2) = 6 dias** e **I(n) = I(n−1) × EF**, arredondados para cima.
4. Depois de cada revisão, dê uma nota **q de 0 a 5**:
   - 5 = perfeita;
   - 4 = correta com hesitação;
   - 3 = correta com muita dificuldade;
   - 2 = errada, mas a certa pareceu fácil;
   - 1 = errada, mas reconheceu a certa;
   - 0 = branco total.
5. Atualize o fator: **EF' = EF + (0,1 − (5 − q) × (0,08 + (5 − q) × 0,02))**. O mínimo é **1,3**.
6. Se **q < 3**, recomece as repetições do item (I(1), I(2)…) **sem mudar o EF**.
7. No mesmo dia, repita os itens com nota **< 4** até que todos tenham nota ≥ 4.

**Como este sistema implementa:**
- Os quatro botões pedidos equivalem a estas notas: **Errei = 1**, **Difícil = 3**, **Bom = 4**, **Fácil = 5**.
- O texto original deixa uma ambiguidade entre os passos 5 e 6. Seguimos a leitura literal: com q < 3, o EF não muda.
- As repetições do passo 7 são tratadas como reforço: não mudam nem o EF nem o intervalo.

### 3.5 Prática deliberada

**O que é:** prática estruturada para melhorar um ponto específico. Mira no limite da sua habilidade atual e tem feedback imediato.

**Evidências**
- **[Ericsson, Krampe & Tesch-Römer (1993)](https://doi.org/10.1037/0033-295X.100.3.363):** estudo com violinistas e pianistas; os autores atribuem as diferenças de desempenho à prática deliberada acumulada.
- **Nuances posteriores:**
  - a meta-análise de [Macnamara, Hambrick & Oswald (2014)](https://doi.org/10.1177/0956797614535810) concluiu que a prática deliberada explica 26% da variância em jogos, 21% em música, 4% em educação e menos de 1% em profissões;
  - a replicação de [Macnamara & Maitra (2019)](https://doi.org/10.1098/rsos.190327) encontrou efeito menor que o original.

**Conclusão:** a prática deliberada é importante, mas não milagrosa.

**Como aplicar:** treine os tipos de problema cobrados (hash, two pointers, SQL, REST…) com feedback de casos de teste. Mantenha um "log de erros": cada erro vira um flashcard ou exercício novo.

### 3.6 Prática intercalada (interleaving)

**O que é:** misturar tipos diferentes de problema na mesma sessão (A-C-B-A) em vez de fazer blocos (AAA-BBB). Isso obriga você a identificar qual estratégia usar em cada problema.

**Evidências**
- **[Rohrer & Taylor (2007)](https://doi.org/10.1007/s11251-007-9015-8):** a prática misturada foi "vastly superior" uma semana depois.
- **[Rohrer, Dedrick & Stershic](https://doi.org/10.1037/edu0000001), em sala de aula:** d = 0,42 no teste imediato e d = 0,79 no teste 30 dias depois.
- **[Kornell & Bjork (2008)](https://doi.org/10.1111/j.1467-9280.2008.02127.x):** a intercalação ajudou a aprender categorias, embora os participantes julgassem os blocos mais eficazes.
- **Meta-análise de [Brunmair & Richter (2019)](https://doi.org/10.1037/bul0000209) (busca):** o efeito é maior com materiais complexos e categorias parecidas entre si.

**Como aplicar:** aprenda o padrão novo em um pequeno bloco e depois misture. Neste sistema, o quiz "Misto" e a fila de flashcards de todos os temas fazem isso, e o cronograma alterna os padrões de algoritmo.

### 3.7 Simulados cronometrados e pré-teste

**Evidências**
- **Transfer-appropriate processing ([Morris, Bransford & Franks, 1977](https://doi.org/10.1016/S0022-5371%2877%2980016-9) (busca)):** você lembra melhor quando o estudo se parece com o que o teste exige. Por isso o simulado deve imitar a prova (tempo, formato, sem consulta).
- **[Smith, Floerke & Thomas (2016)](https://doi.org/10.1126/science.aah5067), *Science*:** quem aprendeu com prática de recuperação ficou protegido do prejuízo de memória causado por estresse agudo.
- **Pré-teste:**
  - responder antes de estudar melhora o aprendizado, mesmo quando você erra no pré-teste ([Richland, Kornell & Kao, 2009](https://doi.org/10.1037/a0016496); [Kornell, Hays & Bjork, 2009](https://doi.org/10.1037/a0015729));
  - o benefício depende de estudar a resposta certa em seguida ([Pan & Carpenter, 2023](https://doi.org/10.1007/s10648-023-09814-5) (busca)).

**Como aplicar:**
- diagnóstico no dia 1;
- simulados semanais cronometrados e sem consulta;
- depois de cada simulado, correção pelos critérios e registro dos erros.

### 3.8 Autoexplicação e efeito de geração

**Evidências**
- **Meta-análise de [Bisra et al. (2018)](https://doi.org/10.1007/s10648-018-9434-x):** prompts de autoexplicação tiveram g = 0,55.
- **[Chi et al. (1989)](https://doi.org/10.1207/s15516709cog1302_1) (busca):** os bons alunos explicam para si mesmos cada passo dos exemplos.
- **Efeito de geração ([Bertsch et al., 2007](https://doi.org/10.3758/BF03193441) (busca)):** d ≈ 0,40 para gerar a informação em vez de só lê-la.

**Como aplicar:** depois de resolver um problema, escreva em 2–3 frases por que a solução funciona e qual é a complexidade. Tente prever a saída do código antes de rodar. Crie os seus próprios flashcards.

### 3.9 Técnica Pomodoro

**Origem:** Francesco Cirillo criou a técnica nos anos 1980, quando era universitário, com um timer de cozinha em forma de tomate. O método completo inclui planejamento do dia e gestão de interrupções; "25 min + pausa" é a versão popular ([site oficial](https://www.pomodorotechnique.com/), [Cirillo](https://www.pomodorotechnique.com/francesco-cirillo/)).

**A evidência é mista:**
- **[Biwer et al. (2023)](https://doi.org/10.1111/bjep.12593):** pausas fixas trouxeram menos fadiga e mais concentração que as pausas autorreguladas.
- **[Smits, Wenzel & de Bruin (2025)](https://doi.org/10.3390/bs15070861):** não houve diferença geral, mas no Pomodoro a fadiga subiu mais rápido ao longo da sessão.
- **Meta-análise de micro-pausas ([Albulescu et al., 2022](https://doi.org/10.1371/journal.pone.0272460)):** as pausas aumentam o vigor e reduzem a fadiga; o efeito no desempenho não foi significativo.

**Como aplicar:** use o Pomodoro para dar ritmo e registrar horas, não como técnica de aprendizagem. Deixe as durações configuráveis (25/5 ou 50/10) e não o use durante simulados, que devem imitar a prova real.

---

## 4. Como este sistema aplica a pesquisa

| Evidência | Funcionalidade |
|---|---|
| Prática de recuperação | Flashcards que mostram só a pergunta; quiz sem consulta; resposta revelada só com clique |
| Prática espaçada | Algoritmo SM-2 com fila de revisões do dia e limite de cartões novos |
| Reforço no mesmo dia (passo 7 do SM-2) | Cartões com nota < 4 voltam ao fim da sessão |
| Prática deliberada / log de erros | Erro no quiz vira flashcard; "Refazer as que errei"; diário com "o que ficou difícil" |
| Interleaving | Quiz misto; fila de flashcards de todos os temas; algoritmos de padrões alternados no cronograma |
| Simulados e pré-teste | Diagnóstico no dia 1; modo "prova cronometrada" no quiz; página Simulado com cronômetro e critérios reais |
| Autoexplicação | Anotações por tópico nas trilhas; campo "o que aprendi" no simulado; flashcards próprios |
| Pomodoro (ritmo, não aprendizagem) | Timer 25/5 configurável que registra as horas; pausa sozinho quando começa um simulado |

---

## 5. Recursos gratuitos

A lista completa, organizada por categoria, está na página **Recursos** do sistema (arquivo `data/recursos.json`). Destaques:

- **Roadmaps:**
  - roadmap.sh ([frontend](https://roadmap.sh/frontend), [backend](https://roadmap.sh/backend), [full-stack](https://roadmap.sh/full-stack), [java](https://roadmap.sh/java), [spring-boot](https://roadmap.sh/spring-boot), [vue](https://roadmap.sh/vue));
  - [perguntas de entrevista](https://roadmap.sh/questions/backend);
  - [The Odin Project](https://www.theodinproject.com/).
- **Prática:**
  - [Exercism](https://exercism.org/tracks/java) (gratuito, com mentoria voluntária);
  - [NeetCode 150](https://neetcode.io/practice/practice/neetcode150);
  - [LeetCode](https://leetcode.com/problems/two-sum/);
  - [beecrowd](https://judge.beecrowd.com/pt/) (brasileiro);
  - [Learn Git Branching em pt-BR](https://learngitbranching.js.org/?locale=pt_BR).
- **Documentação:**
  - [MDN em pt-BR](https://developer.mozilla.org/pt-BR/docs/Learn_web_development);
  - [Vue 3](https://vuejs.org/guide/introduction.html). Não há tradução oficial em pt-BR: [pt.vuejs.org](https://pt.vuejs.org/guide/introduction.html) é português europeu;
  - [Spring Guides](https://spring.io/guides/) e [Spring Boot Reference](https://docs.spring.io/spring-boot/reference/index.html);
  - [Pro Git em pt-BR](https://git-scm.com/book/pt-br/v2).
- **Comunidades brasileiras:**
  - [backend-br](https://github.com/backend-br);
  - [frontendbr](https://github.com/frontendbr). Tem só `vagas`, `forum` e `me-contrata`, sem repositório de desafios; para desafios de front, use [felipefialho/frontend-challenges](https://github.com/felipefialho/frontend-challenges).
- **APIs públicas para projetos, sem chave:**
  - [ViaCEP](https://viacep.com.br/);
  - [BrasilAPI](https://brasilapi.com.br/docs);
  - [IBGE](https://servicodados.ibge.gov.br/api/docs/localidades);
  - [PokeAPI](https://pokeapi.co/docs/v2).
  - Evite a REST Countries: a v3.1 foi descontinuada e a v5 exige chave.

**Observações de versão (set/2026):**
- A documentação atual do Spring Boot é da linha 4.x; a da 3.5 continua em [/spring-boot/3.5/](https://docs.spring.io/spring-boot/3.5/index.html).
- O link antigo do JUnit 5 agora abre o JUnit 6; o guia do 5.x está em [docs.junit.org/5.14.0](https://docs.junit.org/5.14.0/user-guide/).
- Confira qual versão o seu projeto da empresa usa.

---

## 6. Fontes

### Provas e processos seletivos
- Coodesh — [Testes para desenvolvedores Júnior](https://coodesh.com/blog/rh-tech/assessment/veja-como-sua-empresa-pode-aplicar-testes-para-desenvolvedores-junior/)
- Coodesh — [Teste para desenvolvedor: como validar suas habilidades](https://coodesh.com/blog/candidates/saiba-como-validar-suas-habilidades-com-teste-para-desenvolvedor/)
- Lukas de Souza — [Processo Seletivo pra Dev Júnior: O Que Ninguém Te Conta](https://dev.to/lukasdesouza/processo-seletivo-pra-dev-junior-o-que-ninguem-te-conta-2ejj)
- Plataformatec — [6 dicas para mandar bem no código do processo seletivo](https://blog.plataformatec.com.br/2016/03/6-dicas-para-mandar-bem-no-codigo-do-processo-seletivo-da-plataformatec/)
- Osvaldo Santana — [Bastidores de um Processo Seletivo](https://osantana.me/bastidores-de-um-processo-seletivo/)
- João Marcus Fernandes — [Dicas de um Entrevistador Técnico](https://joaomarcuslf.com/posts/dicas-de-um-entrevistador-tecnico)
- Lucas Santos — [Sobre Entrevistas Técnicas](https://blog.lsantos.dev/entrevistas-tecnicas/)
- GeekHunter — [Live Coding](https://www.geekhunter.com/pt/blog/live-coding-como-testar-o-desenvolvedor-antes-de-contratar/) e [Teste para desenvolvedor](https://www.geekhunter.com/pt/blog/teste-para-desenvolvedor-2/)
- Supero — [Teste técnico: manual de boas práticas](https://www.supero.com.br/teste-tecnico-para-desenvolvedores-manual-de-boas-praticas/)
- Fórum DevMedia — [Perguntas ou teste na contratação de Dev Junior](https://www.devmedia.com.br/forum/perguntas-ou-teste-na-contratacao-de-desenvolvedor-junior/542120)
- CIEE/SC — [Efetivação de estagiários: o que 84% das empresas mais valorizam](https://cieesc.org.br/blog/efetivacao-de-estagiario/)
- TabNews/joseromary — [Funcionalidades mais exigidas em testes técnicos Front Jr](https://www.tabnews.com.br/joseromary/funcionalidades-mais-exigidas-em-testes-tecnicos-para-devfront-end-jr)
- TabNews/jhowzs — [Dicas que podem te salvar em uma Entrevista Técnica](https://www.tabnews.com.br/jhowzs/dicas-que-podem-te-salvar-em-uma-entrevista-tecnica)
- Gabriel Bahia — [Perguntas de Entrevistas para Desenvolvedor Java Júnior](https://dev.to/gabrielsantosba/perguntas-de-entrevistas-para-desenvolvedor-java-junior-7lp)
- Thalita Marra — [5 dicas de como escrever um bom desafio técnico](https://dev.to/thalimarra/5-dicas-de-como-escrever-um-bom-desafio-tecnico-kj0)
- Rocketseat — [Erros comuns de desenvolvedores iniciantes](https://www.rocketseat.com.br/blog/artigos/post/erros-comuns-programadores-iniciantes)
- (busca) Grupo Selpe — [Como avaliar um estagiário](https://www.gruposelpe.com.br/blog/como-avaliar-um-estagiario/)
- (busca) Estagiarios.com — [Efetivação de estagiário](https://blog.estagiarios.com/efetivacao-de-estagiario-formar-futuro-colaborador/)
- (busca) Glassdoor — [Entrevistas QuintoAndar](https://www.glassdoor.com.br/Entrevista/QuintoAndar-Software-Engineer-Perguntas-entrevista-EI_IE1161693.0,11_KO12,29.htm)
- (busca) DevPleno — [Codility](https://devpleno.com/codility)
- (busca) Blind — [Relato de teste Codility](https://www.teamblind.com/post/what-to-expect-for-microsoft-oa-new-grad-jc7zlha7)
- (busca) DevMedia — [Checked e Unchecked Exceptions](https://www.devmedia.com.br/diferenca-entre-checked-e-unchecked-exceptions-em-java/28908)
- Repositórios de desafios: ver [tabela 2.6](#26-repositórios-de-desafios-reais-confirmados).

### Técnicas de estudo
- Wozniak (1990) — [SuperMemo / SM-2](https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method)
- Roediger & Karpicke (2006) — [Test-enhanced learning](https://doi.org/10.1111/j.1467-9280.2006.01693.x) · [PubMed](https://pubmed.ncbi.nlm.nih.gov/16507066/)
- Karpicke & Blunt (2011) — [Retrieval practice produces more learning than elaborative studying with concept mapping](https://doi.org/10.1126/science.1199327)
- Adesope, Trevisan & Sundararajan (2017) — [Rethinking the use of tests](https://doi.org/10.3102/0034654316689306)
- Cepeda et al. (2006) — [Distributed practice in verbal recall tasks](https://doi.org/10.1037/0033-2909.132.3.354)
- Cepeda et al. (2008) — [Spacing effects in learning: a temporal ridgeline](https://doi.org/10.1111/j.1467-9280.2008.02209.x)
- Ebbinghaus (1885/1913) — [Memory, cap. VIII](http://www.yorku.ca/pclassic/Ebbinghaus/memory8.htm)
- Ericsson, Krampe & Tesch-Römer (1993) — [The role of deliberate practice](https://doi.org/10.1037/0033-295X.100.3.363)
- Macnamara, Hambrick & Oswald (2014) — [Deliberate practice and performance: a meta-analysis](https://doi.org/10.1177/0956797614535810)
- Macnamara & Maitra (2019) — [Revisiting Ericsson et al. (1993)](https://doi.org/10.1098/rsos.190327)
- Rohrer & Taylor (2007) — [The shuffling of mathematics problems improves learning](https://doi.org/10.1007/s11251-007-9015-8)
- Rohrer, Dedrick & Stershic — [Interleaved practice improves mathematics learning](https://doi.org/10.1037/edu0000001)
- Kornell & Bjork (2008) — [Learning concepts and categories](https://doi.org/10.1111/j.1467-9280.2008.02127.x)
- (busca) Brunmair & Richter (2019) — [Similarity matters](https://doi.org/10.1037/bul0000209)
- Richland, Kornell & Kao (2009) — [The pretesting effect](https://doi.org/10.1037/a0016496)
- Kornell, Hays & Bjork (2009) — [Unsuccessful retrieval attempts enhance subsequent learning](https://doi.org/10.1037/a0015729)
- (busca) Pan & Carpenter (2023) — [Prequestioning and pretesting effects](https://doi.org/10.1007/s10648-023-09814-5)
- Smith, Floerke & Thomas (2016) — [Retrieval practice protects memory against acute stress](https://doi.org/10.1126/science.aah5067)
- (busca) Morris, Bransford & Franks (1977) — [Levels of processing versus transfer appropriate processing](https://doi.org/10.1016/S0022-5371%2877%2980016-9)
- Dunlosky et al. (2013) — [Improving students' learning with effective learning techniques](https://doi.org/10.1177/1529100612453266)
- Biwer et al. (2023) — [Pomodoro vs. self-regulated breaks](https://doi.org/10.1111/bjep.12593)
- Smits, Wenzel & de Bruin (2025) — [Self-regulated, Pomodoro and Flowtime break-taking](https://doi.org/10.3390/bs15070861)
- Albulescu et al. (2022) — [Micro-breaks meta-analysis](https://doi.org/10.1371/journal.pone.0272460)
- Bisra et al. (2018) — [Inducing self-explanation: a meta-analysis](https://doi.org/10.1007/s10648-018-9434-x)
- (busca) Chi et al. (1989) — [Self-explanations](https://doi.org/10.1207/s15516709cog1302_1)
- (busca) Bertsch et al. (2007) — [The generation effect](https://doi.org/10.3758/BF03193441)
- Cirillo — [Pomodoro Technique (site oficial)](https://www.pomodorotechnique.com/)
- Oliveira & Stein (2018) — [Prática de recuperação da memória (PUCRS)](https://doi.org/10.1590/2175-35392018018540)
- Carpenter & Agarwal (trad. 2020) — [Como usar a prática de lembrar espaçada](https://pdf.retrievalpractice.org/translations/Portuguese_Spacing.pdf)

### Recursos
Ver a página **Recursos** do sistema (`data/recursos.json`). Todas as URLs foram verificadas em 23/09/2026. As do Exercism, LeetCode, NeetCode e HackerRank foram confirmadas por busca, porque esses sites bloqueiam verificação automática.
