import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { AssistantAgentId } from '@/hooks/useAssistantAgents';
import { ArrowRight } from 'lucide-react';

type Agent = {
  id: AssistantAgentId;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  iconColor: string;
};

type AssistantAgentsGridProps = {
  agents: Agent[];
  onAgentClick: (agentId: AssistantAgentId) => void;
};

export function AssistantAgentsGrid({
  agents,
  onAgentClick,
}: AssistantAgentsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {agents.map((agent) => {
        const Icon = agent.icon;
        return (
          <Card
            key={agent.id}
            className="group relative cursor-pointer overflow-hidden border-2 transition-all duration-300 hover:border-primary/50 hover:shadow-lg"
            onClick={() => onAgentClick(agent.id)}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${agent.color} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
            />

            <CardHeader className="relative">
              <div className="flex items-start justify-between">
                <div
                  className={`rounded-lg border border-border/50 bg-gradient-to-br p-3 ${agent.color}`}
                >
                  <Icon className={`h-8 w-8 ${agent.iconColor}`} />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
              <CardTitle className="mt-4 text-xl">{agent.title}</CardTitle>
              <CardDescription className="text-base">{agent.description}</CardDescription>
            </CardHeader>

            <CardContent className="relative">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                <span>Disponivel</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
