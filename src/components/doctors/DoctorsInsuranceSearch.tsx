import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

type DoctorsInsuranceSearchProps = {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
};

export function DoctorsInsuranceSearch({
  searchTerm,
  setSearchTerm,
}: DoctorsInsuranceSearchProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Buscar Medico</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Nome, especialidade ou convenio..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-9"
          />
        </div>
      </CardContent>
    </Card>
  );
}
