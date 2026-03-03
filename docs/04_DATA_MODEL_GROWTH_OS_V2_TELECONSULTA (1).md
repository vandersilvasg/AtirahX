# 04_DATA_MODEL_GROWTH_OS_V2_TELECONSULTA

## Atualizações em doctors

-   allow_teleconsultation (boolean)
-   google_calendar_connected (boolean)
-   google_refresh_token (text criptografado)
-   google_calendar_id (text)

------------------------------------------------------------------------

## Atualizações em appointments

-   mode (presencial \| teleconsulta)
-   teleconsultation_provider
-   teleconsultation_link
-   teleconsultation_event_id
-   consent_for_recording (boolean)
-   recording_status
-   recording_url
-   transcript_status
-   summary_status

------------------------------------------------------------------------

## Nova Tabela: teleconsultation_events

-   id
-   tenant_id
-   appointment_id
-   google_event_id
-   meet_link
-   created_at

------------------------------------------------------------------------

## Nova Tabela: appointment_transcripts

-   id
-   tenant_id
-   appointment_id
-   transcript_text
-   structured_summary (jsonb)
-   patient_summary (text)
-   confidence_score
