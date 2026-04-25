# LexQuest MVP

Pacote inicial de dados e documentos do caso `hc_48h_001` para o MVP do jogo narrativo-juridico LexQuest.

## Estrutura

- `docs/product/lexquest-mvp.md`: visao geral do produto, premissa, personagens, telas e backlog.
- `data/cases/hc_48h_001/case.json`: metadados do caso e estado inicial.
- `data/cases/hc_48h_001/documents.json`: documentos desbloqueaveis do caso.
- `data/cases/hc_48h_001/steps.json`: etapas jogaveis e opcoes.
- `data/cases/hc_48h_001/scoring-rules.json`: regras de pontuacao por escolha.
- `data/cases/hc_48h_001/rubric.json`: rubrica de avaliacao do texto livre.
- `data/cases/hc_48h_001/prompts/`: prompts da IA narradora e do avaliador.
- `db/schema.sql`: estrutura SQL inicial para persistencia.
- `db/auth-upgrade.sql`: upgrade incremental para bases ja existentes com contas, permissoes e progresso por usuario.
- `db/seed.lexquest.json`: seed inicial do caso.

## Uso sugerido

1. Carregue `case.json`, `documents.json`, `steps.json` e `scoring-rules.json` no frontend.
2. Use `schema.sql` para criar a base inicial no Supabase/Postgres.
3. Se seu banco ja existe, aplique `db/auth-upgrade.sql` antes de subir a versao com autenticacao.
4. Configure `AUTH_SESSION_SECRET` junto das chaves do Supabase.
5. Persista sessoes em `player_sessions` e escolhas em `player_choices`.
6. Envie os prompts da pasta `prompts/` para a camada de IA junto do estado do jogo.

## Recomendacao inicial do MVP

- Modelo de negocio: gratuito
- Estilo visual: juridico-gamificado
- Publico inicial: estudante de Direito e entusiasta iniciante
- A primeira conta criada no app recebe permissao `admin`; as demais nascem como `user` e podem ser promovidas na central admin.
