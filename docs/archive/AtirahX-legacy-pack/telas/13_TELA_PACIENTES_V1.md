# 13_TELA_PACIENTES_V1

## 1) Objetivo
Gerenciar base de pacientes com visao clinica e comercial em uma tela unica, com busca rapida, historico e proximas acoes.

## 2) Perfis e Uso
- recepcao: cadastro, atualizacao, agendamento, follow-up.
- medico: leitura de pacientes relacionados aos seus atendimentos.
- gestor/admin: visao completa do tenant.

## 3) Layout V1
## 3.1 Barra Superior
- busca global (nome, telefone, documento);
- filtros: status jornada, medico, canal origem, periodo, tags;
- botoes: `Novo paciente`, `Exportar`, `Importar`.

## 3.2 Lista Principal (tabela)
Colunas:
- nome;
- telefone;
- ultimo atendimento;
- proximo agendamento;
- jornada;
- score no-show;
- acao recomendada.

## 3.3 Drawer Lateral (detalhe)
- dados cadastrais;
- timeline de interacoes;
- historico de consultas;
- consentimentos teleconsulta;
- acoes rapidas.

## 4) Acoes Criticas
- criar/editar paciente;
- agendar consulta;
- enviar mensagem;
- adicionar tag;
- registrar observacao;
- abrir prontuario (se permitido).

## 5) Regras de Negocio
1. Evitar duplicidade por telefone e documento no mesmo tenant.
2. Exibir alerta de possivel duplicado no cadastro.
3. Score no-show deve ser explicavel por fatores.
4. Paciente sem atendimento nos ultimos 90 dias entra em reativacao.

## 6) Permissoes V1
- admin: leitura/escrita total.
- gestor: leitura total; escrita opcional por politica.
- recepcao: leitura/escrita operacional.
- medico: leitura relacionada aos proprios appointments.

## 7) APIs/RPCs Sugeridas
- `search_patients(q, filters)`
- `upsert_patient(payload)`
- `merge_patient_records(source_id, target_id)` (admin)
- `get_patient_timeline(patient_id)`

## 8) Estados e UX
- loading skeleton de tabela;
- empty state com CTA `Criar primeiro paciente`;
- erro com retry;
- destaque visual para `acao recomendada`.

## 9) Eventos de Produto
- `patient_created`
- `patient_updated`
- `patient_tag_added`
- `patient_reactivation_triggered`

## 10) Criterios de Aceite
1. Busca retorna paciente em menos de 500ms com filtros comuns.
2. Usuario consegue abrir detalhe do paciente em 1 clique.
3. Duplicidade principal por telefone e documento e bloqueada/alertada.
4. Sem vazamento de dados entre tenants.
