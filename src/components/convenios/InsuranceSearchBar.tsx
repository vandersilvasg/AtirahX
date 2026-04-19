import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

type InsuranceSearchBarProps = {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
};

export function InsuranceSearchBar({
  searchTerm,
  setSearchTerm,
}: InsuranceSearchBarProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar operadora..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>
    </div>
  );
}
