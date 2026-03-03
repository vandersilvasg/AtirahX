# 03_STATE_MACHINE_GROWTH_OS_V2_TELECONSULTA

## Appointment Status

-   AGENDADO
-   CONFIRMADO
-   NAO_CONFIRMADO
-   CANCELADO
-   CANCELADO_POR_NAO_CONFIRMACAO
-   EM_ATENDIMENTO
-   NO_SHOW
-   CONCLUIDO

------------------------------------------------------------------------

## Estados Paralelos de Teleconsulta

### teleconsultation_mode

-   presencial
-   teleconsulta

### teleconsultation_status

-   pending_link
-   link_generated
-   consent_pending
-   consent_accepted
-   consent_declined
-   recording_processing
-   transcript_ready
-   summary_ready

------------------------------------------------------------------------

## Fluxo Adicional

CONFIRMADO (teleconsulta) → gerar evento Google → salvar meet_link →
enviar confirmação com link → solicitar consentimento → processar
transcrição → gerar resumo
