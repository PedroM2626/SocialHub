import { useState } from 'react'
import { DateRange } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { DateRangePicker } from '@/components/ui/date-range-picker'

export interface CommunityFilterValues {
  creationDate?: DateRange
  minMembers: number
  privacy: 'all' | 'public' | 'private'
}

interface CommunityFiltersProps {
  onApply: (filters: CommunityFilterValues) => void
  onClear: () => void
}

export const CommunityFilters = ({
  onApply,
  onClear,
}: CommunityFiltersProps) => {
  const [creationDate, setCreationDate] = useState<DateRange | undefined>()
  const [minMembers, setMinMembers] = useState('0')
  const [privacy, setPrivacy] = useState<'all' | 'public' | 'private'>('all')

  const handleApply = () => {
    onApply({
      creationDate,
      minMembers: Number(minMembers) || 0,
      privacy,
    })
  }

  const handleClear = () => {
    setCreationDate(undefined)
    setMinMembers('0')
    setPrivacy('all')
    onClear()
  }

  return (
    <div className="p-4 space-y-4">
      <h4 className="font-medium leading-none">Filtros de Comunidade</h4>
      <div className="space-y-2">
        <Label>Data de Criação</Label>
        <DateRangePicker date={creationDate} onDateChange={setCreationDate} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="min-members">Mín. Membros</Label>
        <Input
          id="min-members"
          type="number"
          value={minMembers}
          onChange={(e) => setMinMembers(e.target.value)}
          placeholder="0"
        />
      </div>
      <div className="space-y-2">
        <Label>Privacidade</Label>
        <ToggleGroup
          type="single"
          value={privacy}
          onValueChange={(value) => {
            if (value) setPrivacy(value as any)
          }}
          className="w-full"
        >
          <ToggleGroupItem value="all" className="w-full">
            Todas
          </ToggleGroupItem>
          <ToggleGroupItem value="public" className="w-full">
            Públicas
          </ToggleGroupItem>
          <ToggleGroupItem value="private" className="w-full">
            Privadas
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="ghost" onClick={handleClear}>
          Limpar
        </Button>
        <Button onClick={handleApply}>Aplicar</Button>
      </div>
    </div>
  )
}
