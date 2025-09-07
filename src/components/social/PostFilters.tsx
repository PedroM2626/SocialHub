import { useState } from 'react'
import { DateRange } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { DateRangePicker } from '@/components/ui/date-range-picker'

export interface PostFilterValues {
  dateRange?: DateRange
  minLikes: number
  minComments: number
  hasMedia: boolean
  keyword: string
}

interface PostFiltersProps {
  onApply: (filters: PostFilterValues) => void
  onClear: () => void
}

export const PostFilters = ({ onApply, onClear }: PostFiltersProps) => {
  const [date, setDate] = useState<DateRange | undefined>()
  const [minLikes, setMinLikes] = useState('0')
  const [minComments, setMinComments] = useState('0')
  const [hasMedia, setHasMedia] = useState(false)
  const [keyword, setKeyword] = useState('')

  const handleApply = () => {
    onApply({
      dateRange: date,
      minLikes: Number(minLikes) || 0,
      minComments: Number(minComments) || 0,
      hasMedia,
      keyword,
    })
  }

  const handleClear = () => {
    setDate(undefined)
    setMinLikes('0')
    setMinComments('0')
    setHasMedia(false)
    setKeyword('')
    onClear()
  }

  return (
    <div className="p-4 space-y-4">
      <h4 className="font-medium leading-none">Filtros Avançados</h4>
      <div className="space-y-2">
        <Label>Período</Label>
        <DateRangePicker date={date} onDateChange={setDate} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="min-likes">Mín. Curtidas</Label>
          <Input
            id="min-likes"
            type="number"
            value={minLikes}
            onChange={(e) => setMinLikes(e.target.value)}
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
      <div className="space-y-2">
        <Label htmlFor="keyword">Contém a palavra</Label>
        <Input
          id="keyword"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Ex: 'react'"
        />
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="has-media"
          checked={hasMedia}
          onCheckedChange={setHasMedia}
        />
        <Label htmlFor="has-media">Apenas com mídia</Label>
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
