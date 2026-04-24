insert into cases (id, title, description, area, difficulty)
values (
  'hc_48h_001',
  'Habeas Corpus em 48h',
  'Um jovem foi preso por suposto furto de uma parafusadeira. O jogador deve escolher a melhor estrategia urgente para combater a prisao preventiva.',
  'Processo Penal',
  'Iniciante'
);

insert into case_documents (id, case_id, title, document_type, content, unlock_step)
values
  (
    'doc_001',
    'hc_48h_001',
    'Mensagem inicial da familia',
    'mensagem_whatsapp',
    'Doutor(a), boa noite. Meu nome e Sonia, sou mae do Rafael. Meu filho foi preso hoje numa loja de ferramentas no Centro. Disseram que ele furtou uma parafusadeira, mas ele jura que foi um mal-entendido. Ele trabalha fazendo bicos e nunca ficou preso antes. A audiencia foi muito rapida e falaram que ele vai ser transferido. Pelo amor de Deus, da pra fazer alguma coisa ainda hoje?',
    1
  ),
  (
    'doc_002',
    'hc_48h_001',
    'Resumo do auto de prisao em flagrante',
    'documento_policial_resumido',
    'AUTO DE PRISAO EM FLAGRANTE - RESUMO\n\nAos 18 dias do mes corrente, por volta das 17h35, na Loja Ferramax, situada na Rua Central, n. 455, o conduzido Rafael Martins de Oliveira foi detido pelo seguranca Claudio Ramos apos supostamente ocultar em sua mochila uma parafusadeira eletrica da marca Worker, avaliada em R$ 189,90.\n\nSegundo o seguranca, o conduzido circulou por aproximadamente 12 minutos no setor de ferramentas, retirou o produto da prateleira, removeu parcialmente a etiqueta externa e colocou o bem dentro de sua mochila. Ainda segundo o relato, Rafael teria passado pela linha dos caixas sem efetuar o pagamento do item.\n\nO bem foi recuperado integralmente, sem dano aparente, antes da saida definitiva do estabelecimento.\n\nO conduzido declarou que colocou a ferramenta na mochila enquanto atendia uma ligacao de sua mae, negou intencao de subtracao e afirmou que pretendia pagar por outros itens que estavam em sua mao.',
    1
  ),
  (
    'doc_003',
    'hc_48h_001',
    'Termo de declaracao do seguranca',
    'depoimento',
    'DECLARACAO DE CLAUDIO RAMOS\n\nSou seguranca da Loja Ferramax ha quatro anos. Vi o rapaz andando de forma estranha no corredor de ferramentas. Ele pegou uma parafusadeira, olhou para os lados e colocou dentro da mochila. Depois disso, foi para o corredor de tintas e ficou mexendo no celular. Quando caminhou em direcao a saida, eu o abordei apos ele passar pela area dos caixas.\n\nEle tinha outros produtos na mao, mas nao pagou a parafusadeira. A ferramenta estava dentro da mochila. Ele disse que esqueceu, mas, na minha experiencia, isso e conversa comum de quem tenta furtar.\n\nNao houve violencia nem ameaca. Ele colaborou na abordagem.',
    2
  ),
  (
    'doc_004',
    'hc_48h_001',
    'Decisao de conversao em prisao preventiva',
    'decisao_judicial',
    'DECISAO - AUDIENCIA DE CUSTODIA\n\nVistos.\n\nHomologo o auto de prisao em flagrante, pois formalmente regular.\n\nConverto a prisao em flagrante em prisao preventiva para garantia da ordem publica, considerando a gravidade concreta da conduta e o risco de reiteracao delitiva, evidenciado pelo registro anterior constante nos autos.\n\nA liberdade do custodiado, neste momento, representa risco a ordem publica e a credibilidade da Justica, especialmente diante da necessidade de coibir crimes patrimoniais recorrentes na comarca.\n\nIndefiro a liberdade provisoria.\n\nExpeca-se mandado de prisao preventiva.',
    2
  ),
  (
    'doc_005',
    'hc_48h_001',
    'Certidao de antecedentes',
    'certidao_resumida',
    'Consta em nome de Rafael Martins de Oliveira um processo anterior por receptacao culposa, distribuido ha dois anos, ainda sem transito em julgado. Nao ha registro de condenacao definitiva nos documentos analisados.',
    3
  ),
  (
    'doc_006',
    'hc_48h_001',
    'Descricao do video interno da loja',
    'prova_audiovisual_descrita',
    'A camera do corredor de ferramentas mostra Rafael pegando a parafusadeira e colocando o objeto dentro da mochila enquanto fala ao celular. O video nao possui audio. Cerca de dois minutos depois, ele aparece segurando dois rolos de fita isolante e caminhando em direcao a area dos caixas.\n\nA camera da frente da loja mostra Rafael passando proximo aos caixas, mas o angulo nao permite confirmar se ele entrou na fila ou se desviou diretamente para a saida. A abordagem do seguranca ocorre antes que Rafael ultrapasse a porta externa da loja.',
    3
  ),
  (
    'doc_007',
    'hc_48h_001',
    'Nota fiscal de avaliacao do produto',
    'documento_comercial',
    'Produto: Parafusadeira eletrica Worker 12V\nValor de venda: R$ 189,90\nEstado do produto apos apreensao: integro, sem violacao funcional, embalagem parcialmente aberta.',
    3
  ),
  (
    'doc_008',
    'hc_48h_001',
    'Entrevista com o cliente',
    'conversa_reservada',
    'Rafael informa que estava nervoso porque recebeu ligacao de sua mae dizendo que seu irmao menor havia passado mal. Afirma que colocou a ferramenta na mochila para segurar o telefone e os demais itens, mas admite que isso foi ''uma burrice''. Diz que nao chegou a sair da loja e que pretendia pagar as fitas isolantes. Nao sabe explicar por que a etiqueta da embalagem estava parcialmente removida.\n\nAfirma que trabalha informalmente com pequenos reparos e queria comprar a parafusadeira para fazer um servico no dia seguinte.',
    4
  );

insert into case_steps (id, case_id, step_number, title, situation, question, options, unlock_documents)
values
  (
    'step_001',
    'hc_48h_001',
    1,
    'Atendimento emergencial',
    'A mae do cliente procura o jogador logo apos a prisao em flagrante.',
    'Qual sua primeira providencia?',
    '[{"key":"A","text":"Prometer que conseguira soltar Rafael imediatamente."},{"key":"B","text":"Pedir os documentos disponiveis, confirmar onde ele esta preso e explicar que analisara a medida cabivel com urgencia."},{"key":"C","text":"Dizer que so aceita atuar depois de receber honorarios integrais."},{"key":"D","text":"Publicar o caso nas redes sociais para pressionar o juiz."}]'::jsonb,
    '{"doc_001","doc_002"}'
  ),
  (
    'step_002',
    'hc_48h_001',
    2,
    'Analise da decisao judicial',
    'Os autos revelam a conversao da prisao em flagrante em preventiva.',
    'O que chama mais atencao na decisao que converteu o flagrante em preventiva?',
    '[{"key":"A","text":"A decisao parece generica e usa fundamentos abstratos como ordem publica e credibilidade da Justica."},{"key":"B","text":"A decisao e automaticamente correta porque todo furto autoriza preventiva."},{"key":"C","text":"A decisao e nula apenas porque o produto tem valor inferior a um salario minimo."},{"key":"D","text":"A decisao so poderia ter sido tomada pelo STF."}]'::jsonb,
    '{"doc_003","doc_004"}'
  ),
  (
    'step_003',
    'hc_48h_001',
    3,
    'Escolha da medida urgente',
    'Com novos documentos e prova descrita, a defesa precisa agir antes da transferencia.',
    'Qual medida voce prioriza?',
    '[{"key":"A","text":"Habeas corpus com pedido liminar, atacando a fundamentacao generica da preventiva e sustentando suficiencia de medidas cautelares diversas."},{"key":"B","text":"Acao de indenizacao contra a loja."},{"key":"C","text":"Reclamacao constitucional diretamente ao STF."},{"key":"D","text":"Esperar a instrucao criminal para discutir tudo na sentenca."}]'::jsonb,
    '{"doc_005","doc_006","doc_007"}'
  ),
  (
    'step_004',
    'hc_48h_001',
    4,
    'Tese juridica principal',
    'Apos entrevista reservada com o cliente, a defesa define a linha central da impugnacao.',
    'Qual linha argumentativa deve ser central?',
    '[{"key":"A","text":"Apenas dizer que Rafael e inocente, sem enfrentar a decisao judicial."},{"key":"B","text":"Sustentar ausencia de fundamentacao concreta para preventiva, valor reduzido, bem recuperado, ausencia de violencia, primariedade tecnica e possibilidade de cautelares diversas."},{"key":"C","text":"Afirmar que furto em loja nunca e crime."},{"key":"D","text":"Alegar que todo flagrante feito por seguranca privado e ilegal."}]'::jsonb,
    '{"doc_008"}'
  ),
  (
    'step_005',
    'hc_48h_001',
    5,
    'Redacao de fundamento livre',
    'Chegou o momento de redigir o argumento central do pedido liminar.',
    'Escreva um argumento de 5 a 10 linhas para o pedido liminar.',
    '[]'::jsonb,
    '{}'
  ),
  (
    'step_006',
    'hc_48h_001',
    6,
    'Resultado',
    'O sistema consolida as escolhas do jogador e narra o desfecho provisorio do habeas corpus.',
    'Qual foi o resultado da sua estrategia?',
    '[]'::jsonb,
    '{}'
  );

insert into scoring_rules (
  case_id,
  step_number,
  choice_key,
  delta_legalidade,
  delta_estrategia,
  delta_etica,
  flags,
  explanation
)
values
  (
    'hc_48h_001',
    1,
    'B',
    10,
    10,
    10,
    '{"atendimento_responsavel"}',
    'Postura profissional e urgente, sem prometer resultado.'
  ),
  (
    'hc_48h_001',
    1,
    'A',
    -5,
    0,
    -15,
    '{"promessa_resultado"}',
    'Promessa de resultado compromete a etica profissional.'
  ),
  (
    'hc_48h_001',
    2,
    'A',
    15,
    10,
    0,
    '{"identificou_decisao_generica"}',
    'Identifica a ausencia de fundamentacao concreta para a preventiva.'
  ),
  (
    'hc_48h_001',
    3,
    'A',
    15,
    15,
    0,
    '{"escolheu_medida_urgente"}',
    'Prioriza a via urgente compativel com o estado do caso.'
  ),
  (
    'hc_48h_001',
    4,
    'B',
    20,
    15,
    5,
    '{"tese_principal_correta"}',
    'Constroi tese central proporcional, tecnica e consistente com os autos.'
  );
