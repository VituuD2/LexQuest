# LexQuest MVP - Habeas Corpus em 48h

## Escopo

- Nome provisório: LexQuest: Habeas Corpus em 48h
- Area: Direito Penal / Processo Penal
- Formato: web app narrativo com decisoes, documentos, pontuacao e IA como narradora/feedback
- Publico-alvo: estudantes de Direito, concurseiros iniciantes e entusiastas
- Duracao estimada da partida: 20 a 40 minutos
- Objetivo pedagogico: ensinar tomada de decisao juridica em um caso penal urgente, com foco em prisao em flagrante, liberdade provisoria, revogacao de preventiva, habeas corpus, prova, fundamentacao e estrategia

## Premissa narrativa

O jogador assume o papel de um advogado recem-formado que recebe, numa sexta-feira a noite, o pedido desesperado da familia de um jovem preso em flagrante por suposto furto em uma loja de ferramentas.

O caso parece simples, mas ha inconsistencias: o valor do bem e baixo, ha duvida sobre a intencao de subtracao, a decisao judicial que converteu o flagrante em preventiva e generica, e um video da loja pode favorecer ou prejudicar a defesa dependendo da leitura juridica.

O jogador tem 48 horas para decidir a melhor estrategia antes que o cliente seja transferido para o presidio regional.

## Personagens

### Jogador

- Funcao: advogado(a) de defesa
- Objetivo: buscar a medida juridicamente mais adequada e proteger os direitos do cliente sem sacrificar a estrategia

### Cliente

- Nome: Rafael Martins de Oliveira
- Idade: 22 anos
- Profissao: auxiliar de estoque informal
- Situacao: preso em flagrante por suposto furto de uma parafusadeira avaliada em R$ 189,90
- Antecedentes: possui um registro antigo por receptacao culposa, sem transito em julgado informado nos documentos iniciais
- Versao: afirma que colocou a ferramenta na mochila por distracao enquanto atendia uma ligacao da mae e que pretendia pagar outros produtos no caixa

### Mae do cliente

- Nome: Sonia Martins
- Funcao narrativa: procura o jogador e entrega informacoes pessoais do cliente
- Informacao relevante: Rafael ajuda financeiramente em casa e cuida do irmao mais novo

### Seguranca da loja

- Nome: Claudio Ramos
- Funcao: testemunha principal da acusacao
- Versao: afirma que viu Rafael ocultar a ferramenta na mochila e tentar sair sem pagar

### Delegada plantonista

- Nome: Dra. Helena Duarte
- Funcao: presidiu o flagrante
- Observacao: lavrou o auto com base no relato do seguranca e na apreensao do objeto

### Juiz plantonista

- Nome: Dr. Alvaro Siqueira
- Funcao: converteu a prisao em flagrante em preventiva
- Problema juridico: decisao generica, baseada em garantia da ordem publica e suposta reiteracao delitiva

### Promotora

- Nome: Dra. Camila Farias
- Funcao: sustenta manutencao da prisao preventiva
- Tese: risco de reiteracao, prova da materialidade e indicios de autoria

## Metricas do jogo

Cada decisao do jogador altera tres indicadores principais:

- Legalidade: mede se a providencia escolhida e juridicamente adequada
- Estrategia: mede se a decisao e util para o objetivo pratico do cliente
- Etica: mede se o jogador respeitou limites profissionais, boa-fe, sigilo e deveres processuais

Faixas sugeridas:

- 0 a 39: atuacao fraca
- 40 a 69: atuacao defensavel, mas com falhas
- 70 a 89: boa atuacao
- 90 a 100: atuacao excelente

## Telas do MVP

### Home

- Logo LexQuest
- Botao "Iniciar caso"
- Descricao curta do jogo

### Dashboard do caso

- Nome do caso
- Status do cliente
- Prazo restante
- Barras: Legalidade, Estrategia, Etica
- Botao para documentos
- Botao para proxima decisao

### Documentos

- Lista de documentos desbloqueados
- Visualizacao estilo autos/processo

### Decisao

- Situacao narrativa
- Pergunta da etapa
- Opcoes A/B/C/D
- Campo de texto livre quando necessario

### Feedback

- Consequencia narrativa
- Pontuacao alterada
- Feedback juridico
- Proxima etapa

### Resultado final

- Desfecho
- Nota final
- Relatorio de aprendizado
- Botao rejogar

## Backlog tecnico

### Sprint 1 - Prototipo sem IA

- Criar projeto Next.js
- Criar layout basico
- Criar caso fixo em JSON
- Implementar etapas e escolhas
- Implementar pontuacao local
- Implementar tela de resultado

### Sprint 2 - Banco e persistencia

- Criar Supabase
- Criar tabelas
- Inserir seed do caso
- Salvar sessao do jogador
- Salvar escolhas

### Sprint 3 - IA narradora

- Criar rota API para IA
- Enviar estado do jogo para IA
- Receber feedback narrativo
- Salvar mensagens

### Sprint 4 - Texto livre

- Implementar campo de argumento
- Criar avaliacao por rubrica
- Salvar nota do texto
- Mostrar feedback detalhado

### Sprint 5 - Polimento

- Melhorar UI
- Adicionar animacoes leves
- Adicionar relatorio final
- Corrigir bugs

## Criterios de aceite

1. O usuario consegue iniciar o caso.
2. O jogo exibe documentos desbloqueaveis.
3. O usuario toma decisoes em pelo menos 5 etapas.
4. O sistema salva as decisoes.
5. A pontuacao muda conforme as escolhas.
6. A IA gera feedback sem alterar indevidamente o estado do jogo.
7. O usuario recebe um resultado final com aprendizado juridico.
8. Uma partida completa pode ser jogada do inicio ao fim em ate 40 minutos.

## Decisoes pendentes

1. O jogo sera gratuito, pago ou freemium?
2. O visual sera mais serio, estilo sistema juridico, ou mais gamificado, estilo RPG?
3. O foco inicial sera estudante de Direito, concurseiro ou publico geral entusiasta?

Recomendacao inicial: comecar gratuito, visual juridico-gamificado e foco em estudante/entusiasta iniciante.
