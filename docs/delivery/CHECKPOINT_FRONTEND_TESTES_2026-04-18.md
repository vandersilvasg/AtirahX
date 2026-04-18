# Checkpoint Frontend e Testes

Data: 2026-04-18

Projeto: `Atirah-IA-OS`

## Objetivo

Transformar o maior bloco tecnico do worktree atual em uma unidade de revisao mais previsivel.

## Tamanho atual do bloco

- paginas: 21
- hooks: 27
- libs: 16
- componentes: 74
- arquivos de teste: 16
- infraestrutura: 7

## Leitura por tema

### 1. Infraestrutura e runtime

Arquivos centrais observados:

- `package.json`
- `scripts/run-vitest.mjs`
- `vite.config.ts`
- `src/App.tsx`
- `src/main.tsx`
- `src/lib/supabaseClientLoader.ts`

Leitura pragmatica:

- o app foi reestruturado para carregamento mais sob demanda
- a suite de testes ficou operacional via runner dedicado
- o runtime ja assume acesso ao Supabase por loader

### 2. Paginas orquestradoras

Paginas tocadas:

- `Agenda`
- `Assistant`
- `ClinicInfo`
- `Connections`
- `Convenios`
- `CRM`
- `Dashboard`
- `DoctorSchedule`
- `DoctorsInsurance`
- `FollowUp`
- `ForgotPassword`
- `Integration`
- `Login`
- `Patients`
- `PrePatients`
- `Profile`
- `Register`
- `ResetPassword`
- `Teleconsulta`
- `Users`
- `WhatsApp`

Leitura pragmatica:

- a rodada empurrou o projeto para o padrao pagina fina + hooks/componentes dedicados
- esse bloco deve ser revisado como refactor estrutural de orquestracao, nao como alteracoes isoladas de tela

### 3. Hooks e libs operacionais

Principais grupos:

- agenda e interacoes:
  - `useAgendaExternalData`
  - `useAgendaInteractions`
  - `agendaExternalData`
  - `agendaInteractions`
- CRM, convenios e clinica:
  - `useCrmJourney`
  - `useInsuranceManagement`
  - `useClinicInfoManagement`
  - `useDoctorsInsurance`
  - `clinicInfoManagement`
  - `crmJourney`
- pacientes e perfil:
  - `usePatientsManagement`
  - `usePrePatientsManagement`
  - `usePatientData`
  - `usePatientTimeline`
  - `useProfileManagement`
  - `patientData`
  - `patientDetails`
  - `patientTimeline`
- WhatsApp e integracao:
  - `useWhatsAppConversationData`
  - `useWhatsAppMessaging`
  - `useWhatsAppIntegration`
  - `whatsAppIntegration`
  - `automationWorkerClient`
  - `webhookClient`

Leitura pragmatica:

- esse bloco concentra a maior parte da regra de negocio nova ou reorganizada
- a revisao deve partir por dominio funcional, nao por ordem alfabetica de arquivo

### 4. Componentes por dominio

Dominios com maior volume:

- `agenda/`
- `assistant/`
- `clinic-info/`
- `convenios/`
- `crm/`
- `followup/`
- `integration/`
- `patients/`
- `profile/`
- `teleconsulta/`
- `users/`
- `whatsapp/`
- `metrics/`

Leitura pragmatica:

- a mudanca em componentes acompanha o refactor das paginas
- a revisao deve confirmar se os componentes novos sao extracoes legitimas e nao duplicacao acidental de responsabilidade

### 5. Cobertura de testes

Arquivos de teste observados no bloco:

- `useRealtimeList.test.tsx`
- `useRealtimeProfiles.test.tsx`
- `usePatientData.test.tsx`
- `usePatientTimeline.test.tsx`
- `useFileUpload.test.tsx`
- `useWhatsAppConversationData.test.tsx`
- `useWhatsAppMessaging.test.tsx`
- `useCrmJourney.test.tsx`
- `useInsuranceManagement.test.tsx`
- `useClinicInfoManagement.test.tsx`
- `usePatientsManagement.test.tsx`
- `usePrePatientsManagement.test.tsx`
- `useProfileManagement.test.tsx`
- `geminiAnalyzer.test.ts`
- `storageUtils.test.ts`
- infraestrutura em `src/test/`

Estado validado nesta rodada:

- `npm run test:run` -> OK
- 16 arquivos de teste
- 50 testes passando

## Residuos tecnicos imediatos dentro do bloco

- `src/components/ui/chart.tsx` aparece removido e precisa ser entendido apenas como aposentadoria legitima do wrapper anterior, nao perda acidental
- varios caminhos em `src/components/*/` aparecem como diretorios novos, entao a revisao deve confirmar que a extracao ficou coesa por dominio
- hooks novos corrigidos nesta rodada (`Patients`, `PrePatients`, `Profile`, `Insurance`) agora dependem corretamente de `getSupabaseClient()`
- residuos adicionais corrigidos na revisao de `infra + hooks/libs`:
  - `useDoctorSchedule`
  - `useFollowUpManagement`
  - `useSystemSettings`

Leitura pragmatica desses residuos:

- ainda existiam pontos usando `supabase` sem obter a instancia via loader
- isso foi corrigido mantendo a arquitetura atual e sem reabrir refactor amplo

## Melhor forma de revisar esse bloco

1. Infraestrutura e runtime
2. Hooks/libs por dominio
3. Paginas orquestradoras
4. Componentes extraidos por dominio
5. Testes adicionados

## Melhor proxima acao dentro do bloco

Se a consolidacao continuar agora, a melhor sequencia e:

1. validar `infra + hooks/libs`
2. depois revisar `paginas + componentes`
3. usar a suite de testes como fechamento do bloco

## Revisao de paginas e componentes

Recorte revisado nesta rodada:

- `Agenda`
- `WhatsApp`
- `Patients`
- `Dashboard`
- `Integration`
- `DeferredAppChrome`

Leitura pragmatica:

- as paginas centrais estao coerentes com o padrao de pagina orquestradora
- os componentes extraidos aparecem com responsabilidades mais focadas por dominio
- nao foi encontrado import residual de `components/ui/chart`
- nao apareceu quebra objetiva de contrato entre pagina, hook e componente nesse recorte

Conclusao:

- neste ponto, o bloco `paginas + componentes` nao exigiu correcao imediata
- o maior valor ja capturado nesta rodada ficou em `infra + hooks/libs`
