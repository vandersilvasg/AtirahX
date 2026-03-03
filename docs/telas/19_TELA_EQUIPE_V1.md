# 19_TELA_EQUIPE_V1

## 1) Objetivo
Gerenciar colaboradores, medicos e capacidade operacional por unidade.

## 2) Estrutura V1
- lista de usuarios (profiles);
- lista de medicos (doctors);
- vinculos usuario-medico;
- disponibilidade e carga.

## 3) Layout V1
## 3.1 Header
- filtros por role, status, unidade;
- botoes: `Convidar usuario`, `Novo medico`.

## 3.2 Tabela de Equipe
Colunas:
- nome;
- role;
- unidade;
- status;
- ultimo acesso;
- medico vinculado.

## 3.3 Detalhe do membro
- informacoes de perfil;
- permissoes;
- agenda e disponibilidade;
- historico de alteracoes.

## 4) Acoes V1
- convidar usuario;
- ativar/desativar usuario;
- criar/editar medico;
- vincular profile a doctor;
- ajustar capacidade semanal.

## 5) Regras de Negocio
1. E-mail unico por tenant.
2. Desativacao nao apaga historico.
3. Vinculo medico-profile deve ser 1:1 em V1.

## 6) Permissoes
- admin: total.
- gestor: leitura total e escrita parcial configurada.
- outros: sem acesso.

## 7) Criterios de Aceite
1. Convite e ativacao funcionam sem conflito de tenant.
2. Ajustes de equipe refletem na agenda.
3. Alteracoes relevantes auditadas.
