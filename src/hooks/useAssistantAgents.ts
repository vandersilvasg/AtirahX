import { useState } from 'react';
import { Calculator, FileSearch, Microscope } from 'lucide-react';

export type AssistantAgentId = 'cid' | 'medication' | 'exams';

export function useAssistantAgents() {
  const [cidModalOpen, setCidModalOpen] = useState(false);
  const [medicationModalOpen, setMedicationModalOpen] = useState(false);
  const [examModalOpen, setExamModalOpen] = useState(false);

  const agents = [
    {
      id: 'cid' as const,
      title: 'Agent CID',
      description: 'Consulta e busca de codigos CID-10 e CID-11 para diagnosticos',
      icon: FileSearch,
      color: 'from-blue-500/20 to-cyan-500/20',
      iconColor: 'text-blue-500',
    },
    {
      id: 'medication' as const,
      title: 'Agent de Calculo de Medicacao',
      description: 'Calculo preciso de dosagens e posologias medicamentosas',
      icon: Calculator,
      color: 'from-purple-500/20 to-pink-500/20',
      iconColor: 'text-purple-500',
    },
    {
      id: 'exams' as const,
      title: 'Agent de Exames',
      description: 'Auxilio na interpretacao e solicitacao de exames laboratoriais',
      icon: Microscope,
      color: 'from-orange-500/20 to-amber-500/20',
      iconColor: 'text-orange-500',
    },
  ];

  const handleAgentClick = (agentId: AssistantAgentId) => {
    switch (agentId) {
      case 'cid':
        setCidModalOpen(true);
        break;
      case 'medication':
        setMedicationModalOpen(true);
        break;
      case 'exams':
        setExamModalOpen(true);
        break;
    }
  };

  return {
    agents,
    cidModalOpen,
    examModalOpen,
    handleAgentClick,
    medicationModalOpen,
    setCidModalOpen,
    setExamModalOpen,
    setMedicationModalOpen,
  };
}
