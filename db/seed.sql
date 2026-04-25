insert into cases (id, title, description, area, difficulty)
values (
  'hc_48h_001',
  'Habeas Corpus em 48h',
  'Simulacao de plantao criminal: o jogador analisa documentos, escolhe via urgente, seleciona fundamentos e redige argumento liminar contra prisao preventiva.',
  'Processo Penal',
  'Iniciante'
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  area = excluded.area,
  difficulty = excluded.difficulty;

delete from scoring_rules where case_id = 'hc_48h_001';
delete from case_foundations where case_id = 'hc_48h_001';
delete from case_steps where case_id = 'hc_48h_001';
delete from case_documents where case_id = 'hc_48h_001';

insert into case_documents (id, case_id, title, document_type, content, unlock_step)
values
  (
    'doc_001',
    'hc_48h_001',
    'Extrato de conversa da mae de Rafael',
    'mensagem_whatsapp',
    'Sonia informa, fora do horario forense, que Rafael foi preso em loja de ferramentas, que a custodia foi rapida e que ha noticia informal de transferencia. Ela tem informacoes incompletas e pede atuacao urgente.',
    1
  ),
  (
    'doc_002',
    'hc_48h_001',
    'Auto de prisao em flagrante - resumo funcional',
    'documento_policial_resumido',
    'O seguranca relata que Rafael colocou uma parafusadeira Worker 12V, avaliada em R$ 189,90, na mochila. O objeto foi recuperado antes da saida definitiva. Rafael nega intencao de subtracao e afirma que atendia ligacao da mae.',
    1
  ),
  (
    'doc_003',
    'hc_48h_001',
    'Termo de declaracao do seguranca Claudio Ramos',
    'depoimento',
    'O seguranca afirma ter visto ocultacao do produto e passagem pela area dos caixas. Registra que nao houve violencia nem ameaca e que Rafael colaborou na abordagem.',
    2
  ),
  (
    'doc_004',
    'hc_48h_001',
    'Decisao de custodia convertendo flagrante em preventiva',
    'decisao_judicial',
    'A decisao converte o flagrante em preventiva com referencias a ordem publica, credibilidade da Justica e registro anterior, sem individualizar risco concreto atual nem explicar a insuficiencia de cautelares diversas.',
    2
  ),
  (
    'doc_005',
    'hc_48h_001',
    'Certidao resumida de antecedentes',
    'certidao_resumida',
    'Consta processo anterior por receptacao culposa, sem noticia de transito em julgado ou condenacao definitiva nos documentos apresentados.',
    3
  ),
  (
    'doc_006',
    'hc_48h_001',
    'Relatorio interno sobre imagens da loja',
    'prova_audiovisual_descrita',
    'O video mostra Rafael colocando o objeto na mochila enquanto fala ao telefone, mas nao esclarece se entrou na fila ou desviou diretamente para a saida. A abordagem ocorre antes da porta externa.',
    3
  ),
  (
    'doc_007',
    'hc_48h_001',
    'Comprovante comercial e avaliacao do objeto',
    'documento_comercial',
    'Parafusadeira Worker 12V avaliada em R$ 189,90. Item recuperado integralmente, sem dano funcional aparente, com embalagem parcialmente aberta.',
    3
  ),
  (
    'doc_008',
    'hc_48h_001',
    'Memorando de entrevista reservada com Rafael',
    'conversa_reservada',
    'Rafael relata ligacao da mae, diz que colocou a ferramenta na mochila para liberar as maos e admite imprudencia. Nao explica bem a etiqueta parcialmente removida.',
    4
  ),
  (
    'doc_009',
    'hc_48h_001',
    'Certidao de distribuicao do habeas corpus',
    'certidao_judicial',
    'Certifica distribuicao de habeas corpus em regime de plantao, com pedido liminar e indicacao de transferencia iminente.',
    3
  ),
  (
    'doc_010',
    'hc_48h_001',
    'Certidao cartoraria de peticao de revogacao',
    'certidao_judicial',
    'Certifica pedido de revogacao da prisao preventiva no juizo de origem, com documentos pessoais e proposta de cautelares diversas.',
    3
  ),
  (
    'doc_011',
    'hc_48h_001',
    'Nota interna de triagem do relator',
    'despacho_interno',
    'Apontamento de triagem indica que a tese escalonada sera util apenas se a defesa mantiver hierarquia entre cautelaridade, proporcionalidade e merito minimo.',
    4
  );

insert into case_steps (
  id,
  case_id,
  step_number,
  title,
  situation,
  question,
  objective,
  options,
  unlock_documents,
  best_choice,
  pedagogical_note,
  foundation_selection,
  free_text,
  criteria,
  result_bands
)
values
  (
    'step_001',
    'hc_48h_001',
    1,
    'Atendimento emergencial',
    'Sonia procura o escritorio fora do horario forense com informacoes incompletas, abalada e com noticia de possivel transferencia de Rafael. A defesa precisa decidir se age com pouca prova ou organiza coleta minima antes de judicializar.',
    'Qual deve ser a primeira estrategia profissional diante desse atendimento emergencial?',
    'Organizar atuacao urgente sem prometer resultado, com coleta minima, controle de prazo e credibilidade.',
    '[{"key":"A","label":"Coleta estruturada e contato com custodia","text":"O doutor explica que nao pode prometer soltura, mas assume atuacao imediata. Solicita decisao, auto, local de prisao, documentos pessoais e contato para entrevista reservada, enquanto confirma o risco de transferencia.","set_flags":["atendimento_responsavel","coleta_documental_iniciada"]},{"key":"B","label":"HC imediato com relato familiar","text":"O doutor impetra HC com base no relato da mae, valor reduzido e recuperacao do bem. Ganha velocidade, mas corre risco de chegar sem decisao completa e sem documentos essenciais.","set_flags":["protocolo_precipitado"]},{"key":"C","label":"Reconsideracao no plantao de custodia","text":"O doutor pede reconsideracao ao juizo de custodia com documentos pessoais iniciais. A via e plausivel, mas depende de resposta rapida do cartorio e do plantao de origem.","set_flags":["tentou_reconsideracao_origem"]},{"key":"D","label":"Diligencia externa antes de judicializar","text":"O doutor tenta obter declaracao da loja, video e comprovantes antes de qualquer medida. Pode fortalecer a prova, mas atrasa o enfrentamento da prisao.","set_flags":["adiou_impugnacao_urgente"]}]'::jsonb,
    '{"doc_001","doc_002"}',
    'A',
    'A melhor primeira resposta combina urgencia e metodo. As demais alternativas possuem merito parcial, mas carregam riscos de prazo, lastro ou foco.',
    '{"enabled":true,"min":1,"max":2,"prompt":"Selecione de 1 a 2 fundamentos praticos para orientar a primeira resposta do plantao."}'::jsonb,
    null,
    null,
    null
  ),
  (
    'step_002',
    'hc_48h_001',
    2,
    'Leitura da decisao de custodia',
    'A decisao menciona ordem publica, credibilidade da Justica e registro anterior, mas nao individualiza risco concreto. Os autos tambem trazem fatos favoraveis e desfavoraveis.',
    'Qual leitura critica da decisao melhor prepara a defesa?',
    'Identificar o vicio central da preventiva e evitar teses isoladas que nao enfrentem a cautelar.',
    '[{"key":"A","label":"Genericidade e falta de risco concreto","text":"O doutor ataca a ausencia de fundamentacao individualizada e contemporanea da preventiva, sem negar que ha suspeita do fato.","set_flags":["identificou_decisao_generica"]},{"key":"B","label":"Insignificancia como eixo exclusivo","text":"O doutor concentra a critica no valor reduzido e recuperacao do bem. A tese ajuda na proporcionalidade, mas nao enfrenta sozinha a preventiva.","set_flags":["alegou_insignificancia"]},{"key":"C","label":"Negativa de autoria e falta de consumacao","text":"O doutor usa video inconclusivo e abordagem antes da porta externa. O ponto e plausivel, mas desloca o foco para merito.","set_flags":["focou_merito_antes_cautelar"]},{"key":"D","label":"Aceitar a cautelar e preparar instrucao","text":"O doutor deixa a revisao urgente para depois e prioriza prova futura. A escolha abandona uma janela util de impugnacao.","set_flags":["aceitou_preventiva_sem_reagir"]}]'::jsonb,
    '{"doc_003","doc_004"}',
    'A',
    'A linha mais forte e atacar a preventiva onde ela parece fragil: fundamentacao abstrata e falta de individualizacao.',
    '{"enabled":true,"min":1,"max":2,"prompt":"Selecione de 1 a 2 fundamentos que sustentem a critica tecnica da decisao de custodia."}'::jsonb,
    null,
    null,
    null
  ),
  (
    'step_003',
    'hc_48h_001',
    3,
    'Escolha da via processual',
    'Com decisao, auto, video descrito, certidao e avaliacao do bem, a defesa precisa escolher uma via urgente que equilibre prazo e lastro documental.',
    'Qual medida urgente deve ser priorizada?',
    'Escolher uma via processual proporcional ao prazo, aos documentos disponiveis e ao problema central da preventiva.',
    '[{"key":"A","label":"HC com liminar e prova minima forte","text":"O doutor impetra HC com liminar, focado na fundamentacao generica, ausencia de violencia, antecedente sem transito e cautelares. E veloz, mas exige recorte preciso.","unlock_documents":["doc_009"],"set_flags":["escolheu_medida_urgente","rota_hc_plantao"]},{"key":"B","label":"Revogacao no primeiro grau com cautelares","text":"O doutor pede revogacao ou substituicao da preventiva ao juizo de origem, juntando documentos pessoais e proposta concreta de cautelares. E menos veloz que o HC, mas mais organizado para este acervo.","unlock_documents":["doc_010"],"set_flags":["priorizou_origem_com_documentos","tese_cautelares_origem"]},{"key":"C","label":"Aguardar video integral e declaracao da loja","text":"O doutor aguarda prova melhor antes de agir. Pode robustecer a tese, mas arrisca perder a janela de urgencia.","set_flags":["adiou_impugnacao_urgente"]},{"key":"D","label":"Peca ampla com tudo que pode ajudar","text":"O doutor mistura nulidade, merito, indenizacao e teses constitucionais genericas. O volume dispersa a urgencia.","set_flags":["peca_ampla_dispersiva"]}]'::jsonb,
    '{"doc_005","doc_006","doc_007"}',
    'B',
    'B e a melhor neste desenho porque organiza documentos e cautelares no juizo de origem. A tambem e forte se a transferencia estiver confirmada.',
    '{"enabled":true,"min":2,"max":3,"prompt":"Selecione de 2 a 3 fundamentos para sustentar a via processual escolhida."}'::jsonb,
    null,
    null,
    null
  ),
  (
    'step_004',
    'hc_48h_001',
    4,
    'Construcao da tese',
    'A entrevista reservada traz fatos bons e ruins. Rafael colaborou e o bem foi recuperado, mas ha embalagem aberta, mochila e video sem audio. A tese precisa ser forte sem prometer absoluicao.',
    'Qual linha argumentativa deve ocupar o centro da peca urgente?',
    'Formular tese equilibrada, com hierarquia entre cautelaridade, fatos favoraveis, riscos probatorios e pedido subsidiario.',
    '[{"key":"A","label":"Preventiva desproporcional e cautelares","text":"O doutor centra a peca na falta de fundamentacao concreta da preventiva, usando ausencia de violencia, bem recuperado, registro sem transito e cautelares diversas.","set_flags":["tese_principal_correta"]},{"key":"B","label":"Inocencia plena como tese central","text":"O doutor afirma inocencia plena e usa o video como prova conclusiva. A linha ignora pontos ruins e enfraquece a cautelaridade.","set_flags":["exagerou_merito"]},{"key":"C","label":"Insignificancia como tese unica","text":"O doutor aposta no baixo valor e recuperacao do bem. A tese e util subsidiariamente, mas nao responde sozinha ao risco cautelar.","set_flags":["insignificancia_centralizada"]},{"key":"D","label":"Nulidade total pela abordagem privada","text":"O doutor tenta invalidar tudo porque a abordagem veio de seguranca privado. O ponto e lateral e arriscado como tese absoluta.","set_flags":["nulidade_privada_absolutizada"]}]'::jsonb,
    '{"doc_008"}',
    'A',
    'A melhor tese preserva foco na cautelaridade e usa fatos favoraveis sem exagero.',
    '{"enabled":true,"min":2,"max":4,"prompt":"Selecione de 2 a 4 fundamentos que darao espinha dorsal a tese."}'::jsonb,
    null,
    null,
    null
  ),
  (
    'step_005',
    'hc_48h_001',
    5,
    'Redacao livre',
    'A defesa precisa redigir uma minuta liminar de 8 a 12 linhas, com pedido claro, vicio da preventiva, fatos favoraveis, enfrentamento de ponto ruim e cautelares subsidiarias.',
    'Redija o nucleo do pedido liminar e selecione os fundamentos que sustentam a argumentacao.',
    'Treinar argumentacao tecnica de urgencia com pedido claro, estrutura, prova, cautela e coerencia documental.',
    '[]'::jsonb,
    '{}',
    null,
    null,
    '{"enabled":true,"min":3,"max":4,"prompt":"Selecione de 3 a 4 fundamentos que serao efetivamente usados na minuta."}'::jsonb,
    '{"enabled":true,"min_lines":8,"max_lines":12}'::jsonb,
    '["pedido liminar claro","vicio da preventiva","fatos concretos favoraveis","enfrentamento de fato desfavoravel","cautelares diversas como pedido subsidiario","coerencia entre tese e documentos","linguagem tecnica e objetiva"]'::jsonb,
    null
  ),
  (
    'step_006',
    'hc_48h_001',
    6,
    'Resultado',
    'O resultado considera media das metricas, documentos lidos, fundamentos selecionados, qualidade do texto livre, escolhas arriscadas e flags ativadas.',
    'Qual foi o resultado obtido pela defesa no plantao judicial?',
    'Traduzir estrategia, prova, fundamentos e redacao em consequencia processual coerente.',
    '[]'::jsonb,
    '{}',
    null,
    null,
    null,
    null,
    null,
    '[{"label":"excelente","description":"Pedido urgente acolhido ou substituido por cautelares."},{"label":"bom","description":"O julgador pede informacoes urgentes ou reabre a cautelar."},{"label":"medio","description":"A medida e processada sem tutela imediata."},{"label":"ruim","description":"A urgencia perde forca por lacunas, fundamentos perigosos ou texto generico."}]'::jsonb
  );

insert into scoring_rules (
  case_id,
  step_number,
  choice_key,
  delta_legalidade,
  delta_estrategia,
  delta_etica,
  flags,
  explanation,
  consequence
)
values
  ('hc_48h_001', 1, 'A', 12, 12, 6, '{"atendimento_responsavel","coleta_documental_iniciada"}', 'A escolha transforma urgencia familiar em plano profissional verificavel.', 'A familia envia documentos essenciais e a defesa confirma a custodia.'),
  ('hc_48h_001', 1, 'B', 4, 5, -3, '{"protocolo_precipitado"}', 'O HC imediato tem merito pela velocidade, mas falta lastro documental.', 'O protocolo sai rapido, mas a narrativa chega instavel.'),
  ('hc_48h_001', 1, 'C', 6, 1, 3, '{"tentou_reconsideracao_origem"}', 'A via e plausivel, mas pode ser lenta diante da transferencia.', 'A defesa depende da velocidade do juizo de origem.'),
  ('hc_48h_001', 1, 'D', 3, -7, 2, '{"adiou_impugnacao_urgente"}', 'A coleta previa pode ajudar, mas deixa a prisao sem enfrentamento imediato.', 'A defesa ganha prova e perde tempo.'),
  ('hc_48h_001', 2, 'A', 14, 11, 3, '{"identificou_decisao_generica"}', 'A leitura mira a ausencia de fundamentacao concreta da preventiva.', 'A defesa ganha eixo argumentativo claro.'),
  ('hc_48h_001', 2, 'B', 3, 1, 1, '{"alegou_insignificancia"}', 'A insignificancia ajuda na proporcionalidade, mas e incompleta como tese isolada.', 'O defeito central da decisao fica subexplorado.'),
  ('hc_48h_001', 2, 'C', 5, 2, 2, '{"focou_merito_antes_cautelar"}', 'O merito e plausivel, mas desloca o foco do ataque cautelar.', 'A defesa abre debate probatorio e perde nitidez.'),
  ('hc_48h_001', 2, 'D', -7, -10, 1, '{"aceitou_preventiva_sem_reagir"}', 'Aguardar a instrucao abandona uma janela urgente disponivel.', 'A prisao segue sem impugnacao efetiva.'),
  ('hc_48h_001', 3, 'A', 11, 9, 2, '{"escolheu_medida_urgente","rota_hc_plantao"}', 'O HC e forte pela urgencia, mas exige recorte muito preciso.', 'A defesa ganha velocidade no plantao recursal.'),
  ('hc_48h_001', 3, 'B', 13, 12, 3, '{"priorizou_origem_com_documentos","tese_cautelares_origem"}', 'A revogacao no primeiro grau organiza documentos e cautelares diretamente contra a decisao.', 'O pedido chega ao juizo de origem com proposta concreta.'),
  ('hc_48h_001', 3, 'C', 2, -8, 2, '{"adiou_impugnacao_urgente"}', 'Aguardar prova melhor custa tempo demais no plantao.', 'A janela de urgencia fica mais estreita.'),
  ('hc_48h_001', 3, 'D', -5, -9, -1, '{"peca_ampla_dispersiva"}', 'A peca ampla perde hierarquia e confunde a tutela urgente.', 'O julgador tem dificuldade para identificar o pedido central.'),
  ('hc_48h_001', 4, 'A', 14, 13, 4, '{"tese_principal_correta"}', 'A tese concentra forca na cautelaridade e preserva credibilidade.', 'A peca ganha foco e saida proporcional.'),
  ('hc_48h_001', 4, 'B', -4, -6, -3, '{"exagerou_merito"}', 'Inocencia plena superestima a prova e ignora pontos ruins.', 'O pedido perde confiabilidade tecnica.'),
  ('hc_48h_001', 4, 'C', 4, 1, 1, '{"insignificancia_centralizada"}', 'A insignificancia e util subsidiariamente, mas fraca como tese unica.', 'A cautelaridade fica mal enfrentada.'),
  ('hc_48h_001', 4, 'D', -6, -7, -1, '{"nulidade_privada_absolutizada"}', 'A abordagem privada nao invalida automaticamente toda a prisao.', 'A peca se prende a tema lateral.');

insert into case_foundations (id, case_id, label, description, weight, valid_for_steps, risk)
values
  ('fund_documentacao_minima', 'hc_48h_001', 'Lastro documental minimo', 'Confirmar autos, custodia, decisao e documentos pessoais antes de pedir tutela urgente.', '{"legalidade":5,"estrategia":7,"etica":2}'::jsonb, '{1,3,5}', 'baixo'),
  ('fund_transferencia_iminente', 'hc_48h_001', 'Transferencia iminente', 'A transferencia proxima reforca a necessidade de providencia util no plantao.', '{"legalidade":2,"estrategia":7,"etica":0}'::jsonb, '{1,3}', 'baixo'),
  ('fund_decisao_generica', 'hc_48h_001', 'Fundamentacao generica da preventiva', 'A decisao usa expressoes abstratas sem risco concreto atual.', '{"legalidade":10,"estrategia":8,"etica":0}'::jsonb, '{2,3,4,5}', 'baixo'),
  ('fund_ausencia_violencia', 'hc_48h_001', 'Ausencia de violencia ou grave ameaca', 'O fato descrito nao envolve violencia contra pessoa.', '{"legalidade":5,"estrategia":4,"etica":0}'::jsonb, '{2,3,4,5}', 'baixo'),
  ('fund_bem_recuperado', 'hc_48h_001', 'Bem recuperado integralmente', 'O objeto foi recuperado sem perda patrimonial definitiva.', '{"legalidade":4,"estrategia":5,"etica":0}'::jsonb, '{2,3,4,5}', 'baixo'),
  ('fund_sem_transito', 'hc_48h_001', 'Antecedente sem transito em julgado', 'O registro anterior nao aparece como condenacao definitiva.', '{"legalidade":7,"estrategia":6,"etica":0}'::jsonb, '{2,3,4,5}', 'baixo'),
  ('fund_cautelares_diversas', 'hc_48h_001', 'Possibilidade de cautelares diversas', 'Risco residual pode ser enfrentado por medida menos gravosa.', '{"legalidade":8,"estrategia":7,"etica":1}'::jsonb, '{3,4,5}', 'baixo'),
  ('fund_abordagem_antes_saida', 'hc_48h_001', 'Abordagem antes da saida definitiva', 'A abordagem ocorreu antes da porta externa da loja.', '{"legalidade":4,"estrategia":4,"etica":0}'::jsonb, '{3,4,5}', 'baixo'),
  ('fund_video_inconclusivo', 'hc_48h_001', 'Video inconclusivo', 'As imagens nao esclarecem com seguranca a passagem pelos caixas.', '{"legalidade":4,"estrategia":5,"etica":0}'::jsonb, '{3,4,5}', 'baixo'),
  ('fund_vinculo_familiar_residencia', 'hc_48h_001', 'Vinculo familiar e residencia', 'Residencia e suporte familiar reduzem percepcao de risco processual.', '{"legalidade":2,"estrategia":4,"etica":0}'::jsonb, '{1,3,4,5}', 'baixo'),
  ('fund_valor_reduzido', 'hc_48h_001', 'Valor reduzido do bem', 'O valor ajuda na proporcionalidade, mas nao resolve o caso sozinho.', '{"legalidade":3,"estrategia":4,"etica":0}'::jsonb, '{2,3,4,5}', 'medio'),
  ('fund_insignificancia_situacional', 'hc_48h_001', 'Tese de insignificancia', 'Pode ser argumento subsidiario de proporcionalidade.', '{"legalidade":1,"estrategia":2,"etica":0}'::jsonb, '{2,4,5}', 'medio'),
  ('fund_duvida_consumacao', 'hc_48h_001', 'Duvida sobre consumacao', 'O ponto existe, mas exige cautela diante da prova ambigua.', '{"legalidade":2,"estrategia":3,"etica":0}'::jsonb, '{3,4,5}', 'medio'),
  ('fund_colaboracao_abordagem', 'hc_48h_001', 'Colaboracao na abordagem', 'A colaboracao reduz resistencia, mas nao elimina a suspeita.', '{"legalidade":1,"estrategia":2,"etica":0}'::jsonb, '{2,3,4,5}', 'medio'),
  ('fund_trabalho_informal', 'hc_48h_001', 'Trabalho informal', 'Contextualiza o objeto, mas precisa de lastro minimo.', '{"legalidade":1,"estrategia":2,"etica":0}'::jsonb, '{1,3,4,5}', 'medio'),
  ('fund_clamor_social_preventiva', 'hc_48h_001', 'Clamor social autoriza preventiva', 'Repete fundamento abstrato e prejudica a tecnica defensiva.', '{"legalidade":-8,"estrategia":-5,"etica":-1}'::jsonb, '{2,3,4,5}', 'alto'),
  ('fund_todo_antecedente_prende', 'hc_48h_001', 'Todo antecedente justifica prisao', 'Trata registro como motivo automatico de preventiva.', '{"legalidade":-9,"estrategia":-6,"etica":-1}'::jsonb, '{2,3,4,5}', 'alto'),
  ('fund_furto_loja_nunca_crime', 'hc_48h_001', 'Furto de loja nunca e crime', 'Afirmacao absoluta incompativel com os autos.', '{"legalidade":-10,"estrategia":-8,"etica":-2}'::jsonb, '{2,4,5}', 'alto'),
  ('fund_seguranca_invalida_flagrante', 'hc_48h_001', 'Seguranca privado invalida o flagrante', 'Nao ha invalidacao automatica de toda a prisao.', '{"legalidade":-8,"estrategia":-7,"etica":-1}'::jsonb, '{2,4,5}', 'alto'),
  ('fund_baixa_renda_afasta_crime', 'hc_48h_001', 'Baixa renda afasta crime automaticamente', 'Vulnerabilidade social contextualiza, mas nao exclui crime automaticamente.', '{"legalidade":-7,"estrategia":-5,"etica":-2}'::jsonb, '{3,4,5}', 'alto');
