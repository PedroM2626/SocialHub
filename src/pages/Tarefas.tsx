import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Plus,
  Search,
  Filter,
  CheckCircle,
  ListTodo,
  AlertTriangle,
  Upload,
  Download,
  Edit,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import { DayButton } from 'react-day-picker'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input as UiInput } from '@/components/ui/input'
import { tasks as mockTasks } from '@/lib/mock-data'
import { TaskCard } from '@/components/tasks/TaskCard'
import { getTasks, createTask, updateTask, deleteTask } from '@/lib/db'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { TaskFilters, TaskFilterValues } from '@/components/tasks/TaskFilters'
import {
  CreateEditTaskForm,
  TaskFormValues,
} from '@/components/tasks/CreateEditTaskForm'
import { useToast } from '@/components/ui/use-toast'
import { Task, Subtask } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const Tarefas = () => {
  const [tasks, setTasks] = useState<Task[]>(mockTasks)

  // load remote tasks if available
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const remote = await getTasks()
        if (mounted && remote.length > 0) {
          const mapped = remote.map((r: any) => ({
            id: r.id,
            title: r.title,
            description: r.description || '',
            is_completed: r.is_completed || false,
            priority: (r.priority as any) || 'medium',
            is_public: r.is_public !== undefined ? r.is_public : true,
            tags: r.tags || [],
            due_date: r.due_date || null,
            subtasks: r.subtasks || [],
            attachments: r.attachments || [],
            backgroundColor: r.backgroundColor || null,
            borderStyle: r.borderStyle || null,
            titleAlignment: r.titleAlignment || 'left',
            descriptionAlignment: r.descriptionAlignment || 'left',
          }))
          setTasks(mapped)
          return
        }
      } catch (err) {
        console.warn('Failed to load tasks from DB, falling back to mock', err)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<Partial<TaskFilterValues>>({})
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const { toast } = useToast()
  const fileImportRef = useRef<HTMLInputElement>(null)

  // Calendar and events state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [events, setEvents] = useState<{ id: string; title: string; date: string; color?: string }[]>(() => {
    try {
      const raw = localStorage.getItem('local:events')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false)
  const [eventTitle, setEventTitle] = useState('')
  const [createEventColor, setCreateEventColor] = useState<string | undefined>(undefined)

  // edit task modal state (for calendar-day edits)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false)

  // edit event state
  const [editingEvent, setEditingEvent] = useState<{ id: string; title: string; date: string; color?: string } | null>(null)
  const [isEditEventOpen, setIsEditEventOpen] = useState(false)

  // calendar marking color (user can choose) persisted
  const [highlightColor, setHighlightColor] = useState(() => {
    try { return localStorage.getItem('local:highlightColor') || '#f97316' } catch { return '#f97316' }
  })

  // per-date colors persisted
  const [dateColors, setDateColors] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('local:dateColors') || '{}') } catch { return {} }
  })

  // notification range (days) persisted
  const [notificationRangeDays, setNotificationRangeDays] = useState(() => {
    try { return parseInt(localStorage.getItem('local:notificationRangeDays') || '7', 10) } catch { return 7 }
  })

  // persist events/dateColors/highlightColor/notificationRange
  useEffect(() => {
    try { localStorage.setItem('local:events', JSON.stringify(events)) } catch {}
  }, [events])

  useEffect(() => {
    try { localStorage.setItem('local:dateColors', JSON.stringify(dateColors)) } catch {}
  }, [dateColors])

  useEffect(() => {
    try { localStorage.setItem('local:notificationRangeDays', String(notificationRangeDays)) } catch {}
  }, [notificationRangeDays])

  const handleCreateTask = async (data: TaskFormValues) => {
    const newAttachments =
      data.attachments?.map((att) => ({
        id: att.id,
        name: att.name,
        url: att.url,
        size: att.size,
        type: att.type,
      })) || []

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: data.title,
      description: data.description || '',
      is_completed: false,
      priority: data.priority,
      is_public: false,
      tags: data.tags || [],
      due_date: data.due_date,
      subtasks: (data.subtasks as Subtask[]) || [],
      attachments: newAttachments,
      backgroundColor: data.backgroundColor,
      borderStyle: data.borderStyle,
      titleAlignment: data.titleAlignment,
      descriptionAlignment: data.descriptionAlignment,
    }

    // optimistic
    setTasks((prev) => [newTask, ...prev])
    setIsCreateModalOpen(false)

    try {
      const created = await createTask(newTask)
      if (!created) throw new Error('Failed to persist task')
      // replace id if backend returned different
      setTasks((prev) =>
        prev.map((t) => (t.id === newTask.id ? { ...t, id: created.id } : t)),
      )
      toast({ title: 'Sucesso!', description: 'Tarefa criada com sucesso.' })
    } catch (err) {
      console.error('Failed to create task', err)
      setTasks((prev) => prev.filter((t) => t.id !== newTask.id))
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível criar a tarefa.',
      })
    }
  }

  const handleUpdateTask = async (taskId: string, data: TaskFormValues) => {
    const previous = tasks.find((t) => t.id === taskId)
    const updatedAttachments =
      data.attachments?.map((att) => ({
        id: att.id,
        name: att.name,
        url: att.url,
        size: att.size,
        type: att.type,
      })) || []

    const updatedTask = {
      title: data.title,
      description: data.description || '',
      priority: data.priority,
      tags: data.tags || [],
      due_date: data.due_date,
      subtasks: (data.subtasks as Subtask[]) || [],
      attachments: updatedAttachments,
      backgroundColor: data.backgroundColor,
      borderStyle: data.borderStyle,
      titleAlignment: data.titleAlignment,
      descriptionAlignment: data.descriptionAlignment,
    }

    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, ...updatedTask } : task,
      ),
    )

    try {
      const ok = await updateTask(taskId, updatedTask)
      if (!ok) throw new Error('Failed to persist update')
      toast({
        title: 'Sucesso!',
        description: 'Tarefa atualizada com sucesso.',
      })
    } catch (err) {
      console.error('Failed to update task', err)
      if (previous)
        setTasks((prev) => prev.map((t) => (t.id === taskId ? previous : t)))
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível atualizar a tarefa.',
      })
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    const previous = tasks
    setTasks((prev) => prev.filter((task) => task.id !== taskId))
    try {
      const ok = await deleteTask(taskId)
      if (!ok) throw new Error('Failed to delete')
      toast({
        variant: 'destructive',
        title: 'Tarefa exclu��da!',
        description: 'A tarefa foi removida da sua lista.',
      })
    } catch (err) {
      console.error('Failed to delete task', err)
      setTasks(previous)
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível excluir a tarefa.',
      })
    }
  }

  const toggleCompletion = async (
    taskId: string,
    subtaskIdToToggle?: string,
  ) => {
    const toggleChildren = (
      subtasks: Subtask[],
      isChecking: boolean,
    ): Subtask[] => {
      return subtasks.map((sub) => ({
        ...sub,
        is_completed: isChecking,
        subtasks: sub.subtasks ? toggleChildren(sub.subtasks, isChecking) : [],
      }))
    }

    const findAndToggle = (subtasks: Subtask[]): Subtask[] => {
      return subtasks.map((sub) => {
        if (sub.id === subtaskIdToToggle) {
          const newIsCompleted = !sub.is_completed
          return {
            ...sub,
            is_completed: newIsCompleted,
            subtasks: sub.subtasks ? toggleChildren(sub.subtasks, newIsCompleted) : [],
          }
        }
        if (sub.subtasks) {
          return { ...sub, subtasks: findAndToggle(sub.subtasks) }
        }
        return sub
      })
    }

    const previous = tasks

    const nextTasks = tasks.map((task) => {
      if (task.id !== taskId) return task

      if (!subtaskIdToToggle) {
        // Allow completing a task regardless of subtasks state
        const newIsCompleted = !task.is_completed
        return {
          ...task,
          is_completed: newIsCompleted,
          // Do not force subtasks when toggling the main task
          subtasks: task.subtasks,
        }
      }

      // Toggle a specific subtask, but do not auto-change the parent completion
      const updatedSubtasks = findAndToggle(task.subtasks)

      // Keep current task completion as-is when toggling subtasks
      return {
        ...task,
        subtasks: updatedSubtasks,
      }
    })

    setTasks(nextTasks)

    const updatedTask = nextTasks.find((t) => t.id === taskId)
    if (!updatedTask) return

    try {
      const ok = await updateTask(taskId, {
        is_completed: updatedTask.is_completed,
        subtasks: updatedTask.subtasks,
      })
      if (!ok) throw new Error('Failed to persist task update')
    } catch (err) {
      console.error('Failed to persist task toggle', err)
      setTasks(previous)
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível atualizar o status da tarefa.',
      })
    }
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(tasks, null, 2)
    const dataUri =
      'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
    const exportFileDefaultName = 'socialhub_tasks.json'
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
    toast({ title: 'Sucesso!', description: 'Tarefas exportadas.' })
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result
        const importedTasks = JSON.parse(text as string)
        if (Array.isArray(importedTasks)) {
          setTasks((prev) => [...prev, ...importedTasks])
          toast({ title: 'Sucesso!', description: 'Tarefas importadas.' })
        } else {
          throw new Error('Formato de arquivo inválido.')
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Erro de Importação',
          description: 'O arquivo está corrompido ou em formato inválido.',
        })
      }
    }
    reader.readAsText(file)
    if (fileImportRef.current) {
      fileImportRef.current.value = ''
    }
  }

  const tasksDueOnSelectedDate = useMemo(() => {
    if (!selectedDate) return []
    return tasks.filter((t) => {
      if (!t.due_date) return false
      try {
        const d = new Date(t.due_date)
        return d.toDateString() === selectedDate.toDateString()
      } catch {
        return false
      }
    })
  }, [tasks, selectedDate])

  const handleCreateEvent = () => {
    if (!eventTitle || !selectedDate) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Título e data são obrigatórios.' })
      return
    }
    const defaultColor = createEventColor || dateColors[selectedDate.toDateString()] || highlightColor
    const newEvent = { id: `evt-${Date.now()}`, title: eventTitle, date: selectedDate.toISOString(), color: defaultColor }
    const next = [newEvent, ...events]
    setEvents(next)
    try {
      localStorage.setItem('local:events', JSON.stringify(next))
    } catch {}
    setEventTitle('')
    setCreateEventColor(undefined)
    setIsCreateEventOpen(false)
    toast({ title: 'Evento criado', description: 'Seu evento foi agendado.' })
  }

  const filteredTasks = useMemo(
    () =>
      tasks
        .filter((task) => {
          const term = searchTerm.toLowerCase()
          return (
            task.title.toLowerCase().includes(term) ||
            task.description.toLowerCase().includes(term)
          )
        })
        .filter((task) => {
          if (
            filters.dueDate?.from &&
            task.due_date &&
            new Date(task.due_date) < filters.dueDate.from
          )
            return false
          if (
            filters.dueDate?.to &&
            task.due_date &&
            new Date(task.due_date) > filters.dueDate.to
          )
            return false
          if (filters.status === 'completed' && !task.is_completed) return false
          if (filters.status === 'pending' && task.is_completed) return false
          if (
            filters.priority &&
            filters.priority !== 'all' &&
            task.priority !== filters.priority
          )
            return false
          if (
            filters.tag &&
            !task.tags.some((t) =>
              t.name.toLowerCase().includes(filters.tag!.toLowerCase()),
            )
          )
            return false
          return true
        }),
    [tasks, searchTerm, filters],
  )

  const summary = useMemo(() => {
    return {
      completed: tasks.filter((t) => t.is_completed).length,
      pending: tasks.filter((t) => !t.is_completed).length,
      urgent: tasks.filter((t) => t.priority === 'urgent' && !t.is_completed)
        .length,
    }
  }, [tasks])

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 animate-fade-in-down">
        <h1 className="text-3xl font-bold font-display">Minhas Tarefas</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => fileImportRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" /> Importar
          </Button>
          <input
            type="file"
            ref={fileImportRef}
            className="hidden"
            accept=".json"
            onChange={handleImport}
          />
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Exportar
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Criar Tarefa
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 animate-fade-in">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.pending}</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.completed}</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.urgent}</div>
          </CardContent>
        </Card>
      </div>
      <div className="flex items-center gap-4 mb-8 animate-fade-in">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tarefas..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" /> Filtros
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96" align="end">
            <TaskFilters onApply={setFilters} onClear={() => setFilters({})} />
          </PopoverContent>
        </Popover>
      </div>
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="glass-card max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Nova Tarefa</DialogTitle>
          </DialogHeader>
          <CreateEditTaskForm
            onSubmit={handleCreateTask}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Calendário</h3>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Cor</label>
                <input
                  type="color"
                  value={highlightColor}
                  onChange={(e) => { setHighlightColor(e.target.value); try { localStorage.setItem('local:highlightColor', e.target.value) } catch {} }}
                  className="w-8 h-8 p-0 rounded"
                />
                <label className="text-xs text-muted-foreground">Avisos</label>
                <select
                  value={localStorage.getItem('local:notificationRangeDays') || '7'}
                  onChange={(e) => { try { localStorage.setItem('local:notificationRangeDays', e.target.value) } catch {}; /* force re-render by toggling state */ setNotificationRangeDays(parseInt(e.target.value, 10)) }}
                  className="rounded border px-2 py-1 bg-background text-sm"
                >
                  <option value="90">3 meses</option>
                  <option value="30">1 mês</option>
                  <option value="14">2 semanas</option>
                  <option value="7">1 semana</option>
                  <option value="5">5 dias</option>
                  <option value="3">3 dias</option>
                </select>
                <Button size="sm" variant="outline" onClick={() => { setCreateEventColor(undefined); setIsCreateEventOpen(true); }}>
                  Agendar
                </Button>
              </div>
            </div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => setSelectedDate(d as Date | undefined)}
              components={{
                DayButton: (props) => {
                  const day = props.day
                  const key = day ? new Date(day).toDateString() : ''
                  const eventForDay = events.find(e => new Date(e.date).toDateString() === key)
                  const color = (eventForDay && eventForDay.color) || (key && dateColors[key] ? dateColors[key] : null)
                  const tasksCount = tasks.filter(t => t.due_date && new Date(t.due_date as any).toDateString() === key).length
                  const eventsCount = events.filter(e => new Date(e.date).toDateString() === key).length
                  const count = tasksCount + eventsCount
                  const hasItem = count > 0

                  const style: React.CSSProperties = {}
                  if (color) {
                    style.backgroundColor = color
                    style.color = 'white'
                    style.borderRadius = '0.375rem'
                  } else if (hasItem) {
                    style.backgroundColor = highlightColor
                    style.color = 'white'
                    style.borderRadius = '0.375rem'
                  }

                  const isSelected = !!(props.selected || props.modifiers?.selected)
                  if (isSelected) {
                    style.boxShadow = '0 0 0 2px rgba(255,255,255,0.06) inset'
                    style.outline = '2px solid rgba(255,255,255,0.06)'
                  }

                  return (
                    <div className="relative inline-flex">
                      <DayButton {...props} style={{ ...(props.style || {}), ...style }} />
                      {count > 0 && (
                        <span className="absolute -top-2 -right-2 text-[10px] leading-none px-1.5 rounded-full bg-primary text-primary-foreground">
                          {count}
                        </span>
                      )}
                    </div>
                  )
                }
              }}
              style={{ ['--calendar-mark-color' as any]: highlightColor }}
            />
            <div className="mt-4">
              <h4 className="text-sm font-medium">Tarefas no dia</h4>

              <div className="mt-2 mb-3 flex items-center gap-2">
                <label className="text-sm">Cor deste dia</label>
                <input
                  type="color"
                  value={dateColors[selectedDate?.toDateString() || ''] || highlightColor}
                  onChange={(e) => {
                    if (!selectedDate) return
                    const key = selectedDate.toDateString()
                    const next = { ...dateColors, [key]: e.target.value }
                    setDateColors(next)
                    try { localStorage.setItem('local:dateColors', JSON.stringify(next)) } catch {}
                  }}
                />
                <Button size="sm" variant="ghost" onClick={() => {
                  if (!selectedDate) return
                  const key = selectedDate.toDateString()
                  const next = { ...dateColors }
                  delete next[key]
                  setDateColors(next)
                  try { localStorage.setItem('local:dateColors', JSON.stringify(next)) } catch {}
                }}>Reset</Button>
              </div>

              {tasksDueOnSelectedDate.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma tarefa com prazo neste dia.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {tasksDueOnSelectedDate.map((t) => {
                    const daysUntil = t.due_date ? Math.ceil((new Date(t.due_date).getTime() - new Date().setHours(0,0,0,0)) / (1000*60*60*24)) : Infinity
                    const within = daysUntil <= notificationRangeDays && daysUntil >= 0
                    return (
                    <li key={t.id} className="p-2 rounded border bg-accent/10 flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium">{t.title}</div>
                          {within && (
                            <span className="text-[11px] px-2 py-0.5 rounded bg-destructive text-destructive-foreground">Vence em {daysUntil}d</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{t.description}</div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button size="sm" variant="ghost" onClick={() => { setEditingTask(t); setIsEditTaskOpen(true) }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteTask(t.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                    )
                  })}
                </ul>
              )}
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-medium">Eventos</h4>
              {events.filter(e => {
                if (!selectedDate) return false
                return new Date(e.date).toDateString() === selectedDate.toDateString()
              }).length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum evento neste dia.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {events
                    .filter(e => new Date(e.date).toDateString() === selectedDate?.toDateString())
                    .map(e => {
                      const daysUntil = Math.ceil((new Date(e.date).getTime() - new Date().setHours(0,0,0,0)) / (1000*60*60*24))
                      const within = daysUntil <= notificationRangeDays && daysUntil >= 0
                      return (
                      <li key={e.id} className="p-2 rounded border bg-accent/10 flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium">{e.title}</div>
                            {within && <span className="text-[11px] px-2 py-0.5 rounded bg-destructive text-destructive-foreground">Vence em {daysUntil}d</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button size="sm" variant="ghost" onClick={() => { setEditingEvent(e); setIsEditEventOpen(true) }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => {
                            const prev = events
                            const next = events.filter(ev => ev.id !== e.id)
                            setEvents(next)
                            try { localStorage.setItem('local:events', JSON.stringify(next)) } catch {}
                            // no backend persistence required
                          }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </li>
                      )
                    })}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map((task, index) => (
              <div
                key={task.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <TaskCard
                  task={task}
                  onUpdate={handleUpdateTask}
                  onToggleCompletion={toggleCompletion}
                  onDelete={handleDeleteTask}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
        <DialogContent className="glass-card max-w-md">
          <DialogHeader>
            <DialogTitle>Agendar Evento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Título</Label>
            <UiInput value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} />
            <Label>Data</Label>
            <Calendar selected={selectedDate} onSelect={(d) => setSelectedDate(d as Date | undefined)} />
            <Label>Cor (opcional)</Label>
            <input type="color" value={createEventColor || dateColors[selectedDate?.toDateString() || ''] || highlightColor} onChange={(e) => setCreateEventColor(e.target.value)} />
            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => setIsCreateEventOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateEvent}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Task dialog (opened from calendar day list) */}
      <Dialog open={isEditTaskOpen} onOpenChange={setIsEditTaskOpen}>
        <DialogContent className="glass-card max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Tarefa</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <CreateEditTaskForm
              task={editingTask}
              onSubmit={(data) => {
                handleUpdateTask(editingTask.id, data)
                setIsEditTaskOpen(false)
                setEditingTask(null)
              }}
              onCancel={() => {
                setIsEditTaskOpen(false)
                setEditingTask(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Event dialog */}
      <Dialog open={isEditEventOpen} onOpenChange={setIsEditEventOpen}>
        <DialogContent className="glass-card max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Evento</DialogTitle>
          </DialogHeader>
          {editingEvent && (
            <div className="space-y-3">
              <Label>Título</Label>
              <UiInput value={editingEvent.title} onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })} />
              <Label>Data</Label>
              <Calendar selected={new Date(editingEvent.date)} onSelect={(d) => setEditingEvent({ ...editingEvent, date: (d as Date).toISOString() })} />
              <Label>Cor (opcional)</Label>
              <input type="color" value={editingEvent.color || dateColors[new Date(editingEvent.date).toDateString()] || highlightColor} onChange={(e) => setEditingEvent({ ...editingEvent, color: e.target.value })} />
              <div className="flex justify-end gap-2">
                <Button variant="destructive" onClick={() => {
                  const next = events.filter(ev => ev.id !== editingEvent.id)
                  setEvents(next)
                  try { localStorage.setItem('local:events', JSON.stringify(next)) } catch {}
                  setIsEditEventOpen(false)
                  setEditingEvent(null)
                }}>Excluir</Button>
                <Button variant="ghost" onClick={() => { setIsEditEventOpen(false); setEditingEvent(null) }}>Cancelar</Button>
                <Button onClick={() => {
                  const next = events.map(ev => (ev.id === editingEvent.id ? editingEvent : ev))
                  setEvents(next)
                  try { localStorage.setItem('local:events', JSON.stringify(next)) } catch {}
                  setIsEditEventOpen(false)
                  setEditingEvent(null)
                }}>Salvar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
export default Tarefas
