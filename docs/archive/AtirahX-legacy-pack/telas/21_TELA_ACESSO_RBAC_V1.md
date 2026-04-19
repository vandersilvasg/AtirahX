# 21_TELA_ACESSO_RBAC_V1

## 1) Objetivo
Controlar acesso por role, permissoes granulares e trilha de auditoria de seguranca.

## 2) Escopo V1
- roles base: admin, gestor, recepcao, medico;
- matriz de permissao por modulo;
- politicas de sessao;
- logs de acesso sensivel.

## 3) Layout V1
## 3.1 Abas
- Usuarios e Roles
- Matriz de Permissoes
- Politicas de Sessao
- Auditoria

## 3.2 Tabela de Usuarios
- nome;
- email;
- role;
- status;
- ultimo login;
- MFA (se habilitado).

## 3.3 Matriz
- linhas por recurso;
- colunas por role;
- niveis: read, write, deny.

## 4) Acoes V1
- trocar role de usuario (admin);
- ativar/desativar usuario;
- revogar sessao;
- exportar auditoria.

## 5) Regras de Seguranca
1. Troca de role exige confirmacao e log.
2. Usuario nao pode elevar propria role.
3. Acesso a dados sensiveis gera `audit_logs`.
4. Mudancas de permissao possuem historico.

## 6) Integracao com RLS/RPC
- UI deve refletir politica real do banco.
- mudancas no acesso devem manter coerencia com `profiles.role`.
- bloqueios de backend sao fonte de verdade.

## 7) Criterios de Aceite
1. Admin consegue administrar acesso sem SQL manual.
2. Tentativas de elevacao indevida sao bloqueadas.
3. Auditoria de acesso e exportavel por periodo.
4. Nao ha divergencia entre matriz UI e politicas ativas.
