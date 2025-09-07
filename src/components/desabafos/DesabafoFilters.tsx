import { useState } from 'react'
import { DateRange } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DateRangePicker } from '@/components/ui/date-range-picker'

export interface DesabafoFilterValues {
  dateRange?: DateRange
  minReactions: number
  minComments: number
}

interface DesabafoFiltersProps {
  onApply: (filters: DesabafoFilterValues) => void
  onClear: () => void
}

export const DesabafoFilters = ({ onApply, onClear }: DesabafoFiltersProps) => {
  const [date, setDate] = useState<DateRange | undefined>()
  const [minReactions, setMinReactions] = useState('0')
  const [minComments, setMinComments] = useState('0')

  const handleApply = () => {
    onApply({
      dateRange: date,
      minReactions: Number(minReactions) || 0,
      minComments: Number(minComments) || 0,
    })
  }

  const handleClear = () => {
    setDate(undefined)
    setMinReactions('0')
    setMinComments('0')
    onClear()
  }

  return (
    <div className="p-4 space-y-4">
      <h4 className="font-medium leading-none">Filtros de Desabafos</h4>
      <div className="space-y-2">
        <Label>Período</Label>
        <DateRangePicker date={date} onDateChange={setDate} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="min-reactions">Mín. Reações</Label>
          <Input
            id="min-reactions"
            type="number"
            value={minReactions}
            onChange={(e) => setMinReactions(e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="min-comments">Mín. Comentários</Label>
          <Input
            id="min-comments"
            type="number"
            value={minComments}
            onChange={(e) => setMinComments(e.target.value)}
            placeholder="0"
          />
        </div>
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
