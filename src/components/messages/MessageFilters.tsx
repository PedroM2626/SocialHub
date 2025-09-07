import { useState } from 'react'
import { DateRange } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { DateRangePicker } from '@/components/ui/date-range-picker'

export interface MessageFilterValues {
  dateRange?: DateRange
  user: string
  status: 'all' | 'read' | 'unread'
}

interface MessageFiltersProps {
  onApply: (filters: MessageFilterValues) => void
  onClear: () => void
}

export const MessageFilters = ({ onApply, onClear }: MessageFiltersProps) => {
  const [date, setDate] = useState<DateRange | undefined>()
  const [user, setUser] = useState('')
  const [status, setStatus] = useState<'all' | 'read' | 'unread'>('all')

  const handleApply = () => {
    onApply({
      dateRange: date,
      user,
      status,
    })
  }

  const handleClear = () => {
    setDate(undefined)
    setUser('')
    setStatus('all')
    onClear()
  }

  return (
    <div className="p-4 space-y-4">
      <h4 className="font-medium leading-none">Filtros de Mensagens</h4>
      <div className="space-y-2">
        <Label>Período</Label>
        <DateRangePicker date={date} onDateChange={setDate} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="user">Usuário</Label>
        <Input
          id="user"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          placeholder="Nome do usuário"
        />
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <ToggleGroup
          type="single"
          value={status}
          onValueChange={(value) => {
            if (value) setStatus(value as any)
          }}
          className="w-full"
        >
          <ToggleGroupItem value="all" className="w-full">
            Todas
          </ToggleGroupItem>
          <ToggleGroupItem value="read" className="w-full">
            Lidas
          </ToggleGroupItem>
          <ToggleGroupItem value="unread" className="w-full">
            Não Lidas
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
