import { useMemo, useState, type FormEvent } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useFinancialDashboardMetrics } from '@/hooks/useFinancialDashboardMetrics';
import { toast } from 'sonner';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CircleDollarSign,
  HandCoins,
  ReceiptText,
  TrendingUp,
} from 'lucide-react';

type FinancialEntryType = 'income' | 'expense';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const getEntryTypeLabel = (type: FinancialEntryType) => (type === 'income' ? 'Entrada' : 'Saida');

const getEntryTypeClassName = (type: FinancialEntryType) =>
  type === 'income' ? 'text-green-600' : 'text-red-600';

const getTodayDateInput = () => new Date().toISOString().slice(0, 10);

export default function Financeiro() {
  const {
    projectedRevenue,
    realizedIncome,
    manualIncome,
    manualExpense,
    totalIncome,
    balance,
    entries,
    loading,
    error,
    submitting,
    createEntry,
    refresh,
  } = useFinancialDashboardMetrics();

  const [entryType, setEntryType] = useState<FinancialEntryType>('expense');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [occurredAt, setOccurredAt] = useState(getTodayDateInput());
  const [description, setDescription] = useState('');

  const cards = useMemo(
    () => [
      {
        title: 'Faturamento Previsto',
        value: projectedRevenue,
        description: 'Consultas previstas no mes atual',
        icon: CircleDollarSign,
      },
      {
        title: 'Entradas Realizadas',
        value: totalIncome,
        description: `Consultas concluidas + lancamentos (${currencyFormatter.format(manualIncome)})`,
        icon: ArrowUpCircle,
      },
      {
        title: 'Saidas Lançadas',
        value: manualExpense,
        description: 'Lancamentos manuais de saida no mes',
        icon: ArrowDownCircle,
      },
      {
        title: 'Saldo',
        value: balance,
        description: `Entradas (${currencyFormatter.format(realizedIncome)}) - saidas`,
        icon: HandCoins,
      },
    ],
    [balance, manualExpense, manualIncome, projectedRevenue, realizedIncome, totalIncome]
  );

  const revenueCommitment = projectedRevenue > 0 ? (realizedIncome / projectedRevenue) * 100 : 0;
  const manualExpenseShare = totalIncome > 0 ? (manualExpense / totalIncome) * 100 : 0;
  const averageEntryValue =
    entries.length > 0 ? entries.reduce((sum, entry) => sum + Number(entry.amount), 0) / entries.length : 0;
  const financialHighlights = [
    `Receita operacional realizada: ${currencyFormatter.format(realizedIncome)}.`,
    `Receita manual complementar: ${currencyFormatter.format(manualIncome)}.`,
    `Comprometimento do previsto no mes: ${revenueCommitment.toFixed(1)}%.`,
    manualExpense > 0
      ? `Saidas representam ${manualExpenseShare.toFixed(1)}% das entradas totais.`
      : 'Ainda nao ha saidas manuais registradas neste ciclo.',
  ];

  const handleSubmitEntry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedAmount = Number(amount.replace(',', '.'));
    if (!category.trim()) {
      toast.error('Informe a categoria do lancamento.');
      return;
    }
    if (!normalizedAmount || normalizedAmount <= 0) {
      toast.error('Informe um valor maior que zero.');
      return;
    }

    const result = await createEntry({
      type: entryType,
      category: category.trim(),
      amount: normalizedAmount,
      description: description.trim(),
      occurredAt,
    });

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    setCategory('');
    setAmount('');
    setDescription('');
    setEntryType('expense');
    setOccurredAt(getTodayDateInput());
    toast.success('Lancamento financeiro salvo com sucesso.');
  };

  return (
    <DashboardLayout requiredRoles={['owner']}>
      <div className="space-y-8 p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Financeiro</h1>
            <p className="mt-1 text-muted-foreground">
              Painel financeiro comercial da clinica com leitura de receita prevista, realizada e fluxo manual.
            </p>
          </div>
          <Button variant="outline" onClick={() => void refresh()} disabled={loading || submitting}>
            Atualizar
          </Button>
        </div>

        {error ? (
          <Card className="border-red-200">
            <CardContent className="p-4 text-sm text-red-600">{error}</CardContent>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {cards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center justify-between text-xs uppercase tracking-wide">
                  <span>{card.title}</span>
                  <card.icon className="h-4 w-4 text-primary" />
                </CardDescription>
                <CardTitle className="text-2xl">
                  {loading ? '...' : currencyFormatter.format(card.value)}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-xs text-muted-foreground">{card.description}</CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Financeiro Comercial</CardTitle>
              <CardDescription>
                Conecta consultas previstas e concluidas com o faturamento real do mes.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Receita operacional
                </div>
                <p className="mt-3 text-2xl font-semibold text-foreground">
                  {currencyFormatter.format(realizedIncome)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Consultas concluidas e efetivamente realizadas.
                </p>
              </div>

              <div className="rounded-xl border bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <CircleDollarSign className="h-4 w-4 text-primary" />
                  Receita a capturar
                </div>
                <p className="mt-3 text-2xl font-semibold text-foreground">
                  {currencyFormatter.format(Math.max(projectedRevenue - realizedIncome, 0))}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Valor ainda dependente de comparecimento e conclusao.
                </p>
              </div>

              <div className="rounded-xl border bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <ReceiptText className="h-4 w-4 text-primary" />
                  Ticket medio manual
                </div>
                <p className="mt-3 text-2xl font-semibold text-foreground">
                  {currencyFormatter.format(averageEntryValue)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Media dos ultimos lancamentos registrados.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Leitura Executiva</CardTitle>
              <CardDescription>O que o financeiro esta mostrando agora.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {financialHighlights.map((highlight) => (
                <div key={highlight} className="rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">
                  {highlight}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Financeiro Operacional</CardTitle>
              <CardDescription>
                Registre entradas ou saidas manuais para completar a leitura de caixa da operacao.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmitEntry}>
                <div className="space-y-2">
                  <Label htmlFor="entry-type">Tipo</Label>
                  <select
                    id="entry-type"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={entryType}
                    onChange={(event) => setEntryType(event.target.value as FinancialEntryType)}
                  >
                    <option value="expense">Saida</option>
                    <option value="income">Entrada</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entry-category">Categoria</Label>
                  <Input
                    id="entry-category"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    placeholder="Ex.: Aluguel, Marketing, Ajuste"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entry-amount">Valor (R$)</Label>
                  <Input
                    id="entry-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entry-date">Data</Label>
                  <Input
                    id="entry-date"
                    type="date"
                    value={occurredAt}
                    onChange={(event) => setOccurredAt(event.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entry-description">Descricao (opcional)</Label>
                  <Textarea
                    id="entry-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={3}
                    placeholder="Detalhes do lancamento"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Salvando...' : 'Salvar lancamento'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Lancamentos Recentes</CardTitle>
              <CardDescription>
                Ultimos registros financeiros do mes atual para auditoria rapida da operacao.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Carregando lancamentos...</p>
              ) : entries.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum lancamento encontrado para o mes atual.
                </p>
              ) : (
                <div className="space-y-3">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex flex-col gap-2 rounded-lg border p-3 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{entry.category}</p>
                        <p className="text-xs text-muted-foreground">
                          {dateFormatter.format(new Date(entry.occurred_at))}
                          {entry.description ? ` - ${entry.description}` : ''}
                        </p>
                      </div>
                      <div className={`text-sm font-semibold ${getEntryTypeClassName(entry.type)}`}>
                        {getEntryTypeLabel(entry.type)}: {currencyFormatter.format(Number(entry.amount))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
