import { Suspense, lazy } from 'react';
import { AssistantAgentsGrid } from '@/components/assistant/AssistantAgentsGrid';
import { AssistantInfoCards } from '@/components/assistant/AssistantInfoCards';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAssistantAgents } from '@/hooks/useAssistantAgents';

const AgentCIDModal = lazy(() =>
  import('@/components/assistant/AgentCIDModal').then((module) => ({
    default: module.AgentCIDModal,
  }))
);

const AgentExamModal = lazy(() =>
  import('@/components/assistant/AgentExamModal').then((module) => ({
    default: module.AgentExamModal,
  }))
);

const AgentMedicationModal = lazy(() =>
  import('@/components/assistant/AgentMedicationModal').then((module) => ({
    default: module.AgentMedicationModal,
  }))
);

export default function Assistant() {
  const {
    agents,
    cidModalOpen,
    examModalOpen,
    handleAgentClick,
    medicationModalOpen,
    setCidModalOpen,
    setExamModalOpen,
    setMedicationModalOpen,
  } = useAssistantAgents();

  return (
    <DashboardLayout>
      <div className="space-y-8 p-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Assistente Inteligente</h1>
          <p className="mt-1 text-muted-foreground">
            Ferramentas de IA para auxiliar no seu dia a dia clinico
          </p>
        </div>

        <AssistantAgentsGrid agents={agents} onAgentClick={handleAgentClick} />
        <AssistantInfoCards />
      </div>

      <Suspense fallback={null}>
        {cidModalOpen && (
          <AgentCIDModal open={cidModalOpen} onOpenChange={setCidModalOpen} />
        )}

        {medicationModalOpen && (
          <AgentMedicationModal
            open={medicationModalOpen}
            onOpenChange={setMedicationModalOpen}
          />
        )}

        {examModalOpen && (
          <AgentExamModal open={examModalOpen} onOpenChange={setExamModalOpen} />
        )}
      </Suspense>
    </DashboardLayout>
  );
}
