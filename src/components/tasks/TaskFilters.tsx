import { useState } from 'react'
import { DateRange } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Task } from '@/lib/types'

export interface TaskFilterValues {
  dueDate?: DateRange
  status: 'all' | 'completed' | 'pending'
  priority: 'all' | Task['priority']
  tag: string
}

interface TaskFiltersProps {
  onApply: (filters: TaskFilterValues) => void
  onClear: () => void
}

export const TaskFilters = ({ onApply, onClear }: TaskFiltersProps) => {
  const [dueDate, setDueDate] = useState<DateRange | undefined>()
  const [status, setStatus] = useState<'all' | 'completed' | 'pending'>('all')
  const [priority, setPriority] = useState<'all' | Task['priority']>('all')
  const [tag, setTag] = useState('')

  const handleApply = () => {
    onApply({ dueDate, status, priority, tag })
  }

  const handleClear = () => {
    setDueDate(undefined)
    setStatus('all')
    setPriority('all')
    setTag('')
    onClear()
  }

  return (
    <div className="p-4 space-y-4">
      <h4 className="font-medium leading-none">Filtros de Tarefas</h4>
      <div className="space-y-2">
        <Label>Prazo</Label>
        <DateRangePicker date={dueDate} onDateChange={setDueDate} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="completed">Concluídas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Prioridade</Label>
          <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="tag">Tag</Label>
        <Input
          id="tag"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="Ex: 'design'"
        />
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
