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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input as UiInput } from '@/components/ui/input'
import { tasks as mockTasks } from '@/lib/mock-data'
import { TaskCard } from '@/components/tasks/TaskCard'
import { getTasks, createTask, updateTask, deleteTask, syncLocalToSupabase } from '@/lib/db'
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
import { useAuth } from '@/contexts/AuthContext'

const Tarefas = () => {
  // Event date helpers: store as date-only 'YYYY-MM-DD' string to avoid timezone issues.
  function toDateKey(d: Date) {
    return d.toDateString()
  }
  function pad(n: number) {
    return n < 10 ? '0' + n : String(n)
  }
  function formatDateISODateOnly(d: Date) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }
  function parseEventDate(rawDate: string | Date | undefined | null): Date | null {
    if (!rawDate) return null
    if (rawDate instanceof Date) {
      return new Date(rawDate.getFullYear(), rawDate.getMonth(), rawDate.getDate())
    }
    const s = String(rawDate)
    const dateOnlyMatch = s.match(/^\d{4}-\d{2}-\d{2}$/)
    if (dateOnlyMatch) {
      const [y, m, d] = s.split('-').map((n) => parseInt(n, 10))
      return new Date(y, m - 1, d)
    }
    // try parsing full ISO-like string and convert to local date
    const parsed = new Date(s)
    if (!isNaN(parsed.getTime())) {
      return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
    }
    return null
  }
  function normalizeEventDate(rawDate: string | Date | undefined | null) {
    const d = parseEventDate(rawDate)
    if (!d) return null
    return formatDateISODateOnly(d)
  }
  const { user } = useAuth()
  const userId = user?.id
  const [tasks, setTasks] = useState<Task[]>(mockTasks)

  // load remote tasks for current user
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const remote = await getTasks(userId)
        if (mounted) {
          const mapped = remote.map((r: any) => ({
            id: r.id,
            title: r.title,
            description: r.description || '',
            is_completed: r.is_completed || false,
            priority: (r.priority as any) || 'medium',
            is_public: r.is_public !== undefined ? r.is_public : true,
            tags: r.tags || [],
            due_date: r.due_date || null,
            start_time: r.start_time || '',
            end_time: r.end_time || '',
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
        console.warn('Failed to load tasks from DB', err)
        // set to empty list to avoid showing mock placeholders
        if (mounted) setTasks([])
      }
    })()
    return () => {
      mounted = false
    }
  }, [userId])
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<Partial<TaskFilterValues>>({})
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const { toast } = useToast()
  const fileImportRef = useRef<HTMLInputElement>(null)

  // Calendar and events state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [events, setEvents] = useState<
    {
      id: string
      title: string
      date: string
      color?: string
      start_time?: string
      end_time?: string
    }[]
  >(() => {
    try {
      const raw = localStorage.getItem('local:events')
      const parsed = raw ? JSON.parse(raw) : []
      if (Array.isArray(parsed)) {
        return parsed.map((ev: any) => ({
          ...ev,
          date: normalizeEventDate(ev.date) || ev.date,
        }))
      }
      return []
    } catch {
      return []
    }
  })
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false)
  const [eventTitle, setEventTitle] = useState('')
  const [createEventColor, setCreateEventColor] = useState<string | undefined>(
    undefined,
  )
  const [createEventStartTime, setCreateEventStartTime] = useState<string>('')
  const [createEventEndTime, setCreateEventEndTime] = useState<string>('')

  // edit task modal state (for calendar-day edits)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false)

  // edit event state
  const [editingEvent, setEditingEvent] = useState<{
    id: string
    title: string
    date: string
    color?: string
    start_time?: string
    end_time?: string
  } | null>(null)
  const [isEditEventOpen, setIsEditEventOpen] = useState(false)

  // calendar marking color (user can choose) persisted
  const [highlightColor, setHighlightColor] = useState(() => {
    try {
      return localStorage.getItem('local:highlightColor') || '#f97316'
    } catch {
      return '#f97316'
    }
  })

  // per-date colors persisted
  const [dateColors, setDateColors] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem('local:dateColors') || '{}')
    } catch {
      return {}
    }
  })

  // notification range customizable (value + unit)
  const [notificationRangeValue, setNotificationRangeValue] = useState<number>(
    () => {
      try {
        const stored = localStorage.getItem('local:notificationRangeValue')
        if (stored) return parseInt(stored, 10)
        const legacy = localStorage.getItem('local:notificationRangeDays')
        return legacy ? parseInt(legacy, 10) : 7
      } catch {
        return 7
      }
    },
  )
  const [notificationRangeUnit, setNotificationRangeUnit] = useState<
    'hours' | 'days' | 'months'
  >(() => {
    try {
      return (
        (localStorage.getItem('local:notificationRangeUnit') as any) || 'days'
      )
    } catch {
      return 'days'
    }
  })

  // helper to normalize and persist events
  function saveEvents(next: any[]) {
    const normalized = next.map((ev: any) => ({
      ...ev,
      date: normalizeEventDate(ev.date) || ev.date,
    }))
    try {
      localStorage.setItem('local:events', JSON.stringify(normalized))
    } catch {}
    setEvents(normalized)
  }

  // one-time migration: normalize + dedupe local:events and push to Supabase
  useEffect(() => {
    try {
      const raw = localStorage.getItem('local:events')
      if (!raw) return
      let arr = JSON.parse(raw)
      if (!Array.isArray(arr)) return
      // normalize dates
      arr = arr.map((ev: any) => ({ ...ev, date: normalizeEventDate(ev.date) || ev.date }))
      // dedupe by id, prefer latest by timestamp
      const byId: Record<string, any> = {}
      for (const ev of arr) {
        if (!ev.id) ev.id = `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        if (!byId[ev.id]) byId[ev.id] = ev
        else {
          try {
            const a = new Date(byId[ev.id].date)
            const b = new Date(ev.date)
            if (b.getTime() > a.getTime()) byId[ev.id] = ev
          } catch {
            byId[ev.id] = ev
          }
        }
      }
      const deduped = Object.values(byId)
      // also dedupe by title+date to avoid duplicates if ids missing
      const seen: Record<string, any> = {}
      const final: any[] = []
      for (const ev of deduped) {
        const key = `${ev.title?.toLowerCase() || ''}::${new Date(ev.date).toDateString()}`
        if (!seen[key]) {
          seen[key] = true
          final.push(ev)
        }
      }
      // persist normalized/deduped
      saveEvents(final)
      // attempt to sync to Supabase for current user
      try {
        syncLocalToSupabase().catch((e) =>
          console.warn('[Tarefas] syncLocalToSupabase failed', e),
        )
      } catch (e) {}
    } catch (err) {
      console.warn('[Tarefas] one-time event migration failed', err)
    }
  }, [])

  // persist events/dateColors/highlightColor/notificationRange
  useEffect(() => {
    try {
      // ensure events in storage are normalized
      const normalized = events.map((ev: any) => ({
        ...ev,
        date: normalizeEventDate(ev.date) || ev.date,
      }))
      localStorage.setItem('local:events', JSON.stringify(normalized))
    } catch {}
  }, [events])

  useEffect(() => {
    try {
      localStorage.setItem('local:dateColors', JSON.stringify(dateColors))
    } catch {}
  }, [dateColors])

  useEffect(() => {
    try {
      localStorage.setItem(
        'local:notificationRangeValue',
        String(notificationRangeValue),
      )
      localStorage.setItem('local:notificationRangeUnit', notificationRangeUnit)
    } catch {}
  }, [notificationRangeValue, notificationRangeUnit])

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
      start_time: (data as any).start_time || '',
      end_time: (data as any).end_time || '',
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
      const created = await createTask({ ...newTask, user_id: userId })
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
      start_time: (data as any).start_time || '',
      end_time: (data as any).end_time || '',
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
      const ok = await updateTask(taskId, updatedTask, userId)
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
      const ok = await deleteTask(taskId, userId)
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
            subtasks: sub.subtasks
              ? toggleChildren(sub.subtasks, newIsCompleted)
              : [],
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
      const ok = await updateTask(
        taskId,
        {
          is_completed: updatedTask.is_completed,
          subtasks: updatedTask.subtasks,
        },
        userId,
      )
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
    const payload = {
      tasks,
      events,
      dateColors,
      highlightColor,
      notificationRangeValue,
      notificationRangeUnit,
    }
    const dataStr = JSON.stringify(payload, null, 2)
    const dataUri =
      'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
    const exportFileDefaultName = 'socialhub_tasks_export.json'
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
    toast({
      title: 'Sucesso!',
      description: 'Tarefas e configurações exportadas.',
    })
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const imported = JSON.parse(text)

        if (Array.isArray(imported)) {
          setTasks(imported)
          toast({ title: 'Sucesso!', description: 'Tarefas importadas.' })
        } else if (imported && typeof imported === 'object') {
          if (imported.tasks) setTasks(imported.tasks)
          if (imported.events)
            setEvents(
              (imported.events || []).map((ev: any) => ({
                ...ev,
                date: normalizeEventDate(ev.date) || ev.date,
              })),
            )
          if (imported.dateColors) setDateColors(imported.dateColors)
          if (imported.highlightColor)
            setHighlightColor(imported.highlightColor)
          if (typeof imported.notificationRangeValue === 'number')
            setNotificationRangeValue(imported.notificationRangeValue)
          else if (imported.notificationRangeDays)
            setNotificationRangeValue(imported.notificationRangeDays)
          if (imported.notificationRangeUnit)
            setNotificationRangeUnit(imported.notificationRangeUnit)

          try {
            const normalized = (imported.events || []).map((ev: any) => ({
              ...ev,
              date: normalizeEventDate(ev.date) || ev.date,
            }))
            // use saveEvents to both set state and persist
            saveEvents(normalized)
          } catch {}
          try {
            localStorage.setItem(
              'local:dateColors',
              JSON.stringify(imported.dateColors || {}),
            )
          } catch {}
          try {
            localStorage.setItem(
              'local:highlightColor',
              imported.highlightColor || '',
            )
          } catch {}
          try {
            localStorage.setItem(
              'local:notificationRangeValue',
              String(
                imported.notificationRangeValue ||
                  imported.notificationRangeDays ||
                  notificationRangeValue,
              ),
            )
            if (imported.notificationRangeUnit)
              localStorage.setItem(
                'local:notificationRangeUnit',
                imported.notificationRangeUnit,
              )
          } catch {}

          toast({ title: 'Sucesso!', description: 'Dados importados.' })
        } else {
          throw new Error('Formato inválido')
        }
      } catch (error) {
        console.error('Import failed', error)
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

  const handleMigrateLocalToSupabase = async () => {
    if (!userId) {
      toast({
        variant: 'destructive',
        title: 'Login necessário',
        description: 'Faça login antes de migrar tarefas.',
      })
      return
    }

    let raw: string | null = null
    try {
      raw = localStorage.getItem('local:tasks')
    } catch (e) {
      console.error('Failed to read local:tasks', e)
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível acessar tarefas locais.',
      })
      return
    }

    if (!raw) {
      toast({
        title: 'Nada a migrar',
        description: 'Nenhuma tarefa local encontrada.',
      })
      return
    }

    let localTasks: any[] = []
    try {
      localTasks = JSON.parse(raw)
      if (!Array.isArray(localTasks) || localTasks.length === 0) {
        toast({
          title: 'Nada a migrar',
          description: 'Nenhuma tarefa local encontrada.',
        })
        return
      }
    } catch (e) {
      console.error('Failed to parse local tasks', e)
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Formato inválido das tarefas locais.',
      })
      return
    }

    const results: {
      ok: boolean
      id?: string
      error?: any
      localId?: string
    }[] = []
    for (const t of localTasks) {
      try {
        const payload: any = { ...t, user_id: userId }
        // Normalize due_date if it's a Date object string
        if (payload.due_date && payload.due_date instanceof Date)
          payload.due_date = payload.due_date.toISOString()
        const created = await createTask(payload)
        results.push({ ok: true, id: created?.id, localId: t.id })
      } catch (err) {
        results.push({ ok: false, error: String(err), localId: t.id })
      }
    }

    const failures = results.filter((r) => !r.ok)
    const successCount = results.filter((r) => r.ok).length

    if (successCount > 0) {
      try {
        const remote = await getTasks(userId)
        const mapped = remote.map((r: any) => ({
          id: r.id,
          title: r.title,
          description: r.description || '',
          is_completed: r.is_completed || false,
          priority: (r.priority as any) || 'medium',
          is_public: r.is_public !== undefined ? r.is_public : true,
          tags: r.tags || [],
          due_date: r.due_date || null,
          start_time: r.start_time || '',
          end_time: r.end_time || '',
          subtasks: r.subtasks || [],
          attachments: r.attachments || [],
          backgroundColor: r.backgroundColor || null,
          borderStyle: r.borderStyle || null,
          titleAlignment: r.titleAlignment || 'left',
          descriptionAlignment: r.descriptionAlignment || 'left',
        }))
        setTasks(mapped)
      } catch (e) {
        console.error('Failed to reload tasks after migration', e)
      }
    }

    if (failures.length === 0) {
      try {
        localStorage.removeItem('local:tasks')
      } catch {}
      toast({
        title: 'Migração completa',
        description: `${successCount} tarefas migradas.`,
      })
    } else {
      toast({
        variant: 'destructive',
        title: 'Migração parcial',
        description: `${successCount} migradas, ${failures.length} falharam. Ver console para detalhes.`,
      })
      console.error('Migration failures', failures)
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
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Título e data são obrigatórios.',
      })
      return
    }
    const defaultColor =
      createEventColor ||
      dateColors[selectedDate.toDateString()] ||
      highlightColor
    const newEvent = {
      id: `evt-${Date.now()}`,
      title: eventTitle,
      date: normalizeEventDate(selectedDate)!,
      color: defaultColor,
      start_time: createEventStartTime || '',
      end_time: createEventEndTime || '',
    }
    const next = [newEvent, ...events]
    saveEvents(next)
    setEventTitle('')
    setCreateEventColor(undefined)
    setCreateEventStartTime('')
    setCreateEventEndTime('')
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
        <h1 className="text-2xl sm:text-3xl font-bold font-display">
          Minhas Tarefas
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileImportRef.current?.click()}
            className="w-full sm:w-auto"
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="w-full sm:w-auto"
          >
            <Download className="mr-2 h-4 w-4" /> Exportar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleMigrateLocalToSupabase}
            className="w-full sm:w-auto"
          >
            <Upload className="mr-2 h-4 w-4" /> Migrar locais → Supabase
          </Button>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            size="sm"
            className="w-full sm:w-auto"
          >
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
          <PopoverContent className="w-full max-w-xs sm:w-96" align="end">
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
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  Cor
                </span>
                <input
                  aria-label="Selecionar cor do calendário"
                  type="color"
                  value={highlightColor}
                  onChange={(e) => {
                    setHighlightColor(e.target.value)
                    try {
                      localStorage.setItem(
                        'local:highlightColor',
                        e.target.value,
                      )
                    } catch {}
                  }}
                  className="w-8 h-8 p-0 rounded"
                />
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  Avisos
                </span>
                <input
                  aria-label="Quantidade"
                  type="number"
                  min={1}
                  value={notificationRangeValue}
                  onChange={(e) =>
                    setNotificationRangeValue(
                      Math.max(1, parseInt(e.target.value || '1', 10)),
                    )
                  }
                  className="rounded border px-2 py-1 bg-background text-sm w-20"
                />
                <select
                  aria-label="Unidade"
                  value={notificationRangeUnit}
                  onChange={(e) =>
                    setNotificationRangeUnit(e.target.value as any)
                  }
                  className="rounded border px-2 py-1 bg-background text-sm w-full sm:w-auto"
                >
                  <option value="hours">horas</option>
                  <option value="days">dias</option>
                  <option value="months">meses</option>
                </select>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    setCreateEventColor(undefined)
                    setCreateEventStartTime('')
                    setCreateEventEndTime('')
                    setIsCreateEventOpen(true)
                  }}
                >
                  Agendar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={async () => {
                    try {
                      toast({ title: 'Iniciando migração', description: 'Enviando eventos locais para Supabase...' })
                      await syncLocalToSupabase(userId)
                      toast({ title: 'Migração concluída', description: 'Eventos locais foram migrados (se existirem).' })
                    } catch (err) {
                      console.error('Force migrate events failed', err)
                      toast({ variant: 'destructive', title: 'Migração falhou', description: String(err) })
                    }
                  }}
                >
                  Forçar migrar eventos
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
                  const key = day ? toDateKey(day) : ''
                  const eventForDay = events.find((e) => {
                    const ed = parseEventDate(e.date)
                    return ed ? toDateKey(ed) === key : false
                  })
                  const color =
                    (eventForDay && eventForDay.color) ||
                    (key && dateColors[key] ? dateColors[key] : null)
                  const tasksCount = tasks.filter(
                    (t) =>
                      t.due_date &&
                      new Date(t.due_date as any).toDateString() === key,
                  ).length
                  const eventsCount = events.filter((e) => {
                    const ed = parseEventDate(e.date)
                    return ed ? toDateKey(ed) === key : false
                  }).length
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

                  const isSelected = !!(
                    props.selected || props.modifiers?.selected
                  )
                  if (isSelected) {
                    style.boxShadow = '0 0 0 2px rgba(255,255,255,0.06) inset'
                    style.outline = '2px solid rgba(255,255,255,0.06)'
                  }

                  return (
                    <div className="relative inline-flex">
                      <DayButton
                        {...props}
                        style={{ ...(props.style || {}), ...style }}
                      />
                      {count > 0 && (
                        <span className="absolute -top-2 -right-2 text-[10px] leading-none px-1.5 rounded-full bg-primary text-primary-foreground">
                          {count}
                        </span>
                      )}
                    </div>
                  )
                },
              }}
              style={{ ['--calendar-mark-color' as any]: highlightColor }}
            />
            <div className="mt-4">
              <h4 className="text-sm font-medium">Tarefas no dia</h4>

              <div className="mt-2 mb-3 flex items-center gap-2">
                <label className="text-sm">Cor deste dia</label>
                <input
                  type="color"
                  value={
                    dateColors[selectedDate?.toDateString() || ''] ||
                    highlightColor
                  }
                  onChange={(e) => {
                    if (!selectedDate) return
                    const key = selectedDate.toDateString()
                    const next = { ...dateColors, [key]: e.target.value }
                    setDateColors(next)
                    try {
                      localStorage.setItem(
                        'local:dateColors',
                        JSON.stringify(next),
                      )
                    } catch {}
                  }}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (!selectedDate) return
                    const key = selectedDate.toDateString()
                    const next = { ...dateColors }
                    delete next[key]
                    setDateColors(next)
                    try {
                      localStorage.setItem(
                        'local:dateColors',
                        JSON.stringify(next),
                      )
                    } catch {}
                  }}
                >
                  Reset
                </Button>
              </div>

              {tasksDueOnSelectedDate.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma tarefa com prazo neste dia.
                </p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {tasksDueOnSelectedDate.map((t) => {
                    const target = (() => {
                      const base = t.due_date
                        ? new Date(t.due_date as any)
                        : null
                      if (!base) return null
                      if ((t as any).start_time) {
                        const [hh, mm] = (t as any).start_time
                          .split(':')
                          .map((n: string) => parseInt(n, 10))
                        const dt = new Date(base)
                        dt.setHours(hh, mm, 0, 0)
                        return dt
                      }
                      const dt = new Date(base)
                      dt.setHours(0, 0, 0, 0)
                      return dt
                    })()
                    const now = new Date()
                    const remaining = (() => {
                      if (!target) return Infinity
                      const diffMs = target.getTime() - now.getTime()
                      if (notificationRangeUnit === 'hours')
                        return Math.ceil(diffMs / (1000 * 60 * 60))
                      if (notificationRangeUnit === 'months')
                        return Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30))
                      return Math.ceil(
                        (target.getTime() - new Date().setHours(0, 0, 0, 0)) /
                          (1000 * 60 * 60 * 24),
                      )
                    })()
                    const within =
                      remaining <= notificationRangeValue && remaining >= 0
                    return (
                      <li
                        key={t.id}
                        className="p-2 rounded border bg-accent/10 flex items-start justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium">{t.title}</div>
                            {within && (
                              <span className="text-[11px] px-2 py-0.5 rounded bg-destructive text-destructive-foreground">
                                Vence em {(() => {
                                  if (typeof target === 'undefined') return 'N/A'
                                  const diffMs = target.getTime() - now.getTime()
                                  if (notificationRangeUnit === 'hours')
                                    return `${Math.ceil(diffMs / (1000 * 60 * 60))}h`
                                  if (notificationRangeUnit === 'months')
                                    return `${Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30))}m`
                                  return `${Math.ceil(
                                    (target.getTime() - new Date().setHours(0, 0, 0, 0)) /
                                      (1000 * 60 * 60 * 24),
                                  )}d`
                                })()}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t.description}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingTask(t)
                              setIsEditTaskOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteTask(t.id)}
                          >
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
              {events.filter((e) => {
                if (!selectedDate) return false
                return (
                  new Date(e.date).toDateString() ===
                  selectedDate.toDateString()
                )
              }).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum evento neste dia.
                </p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {events
                    .filter((e) => {
                      const ed = parseEventDate(e.date)
                      return ed ? ed.toDateString() === selectedDate?.toDateString() : false
                    })
                    .map((e) => {
                      const target = (() => {
                        const base = parseEventDate(e.date) || new Date()
                        if ((e as any).start_time) {
                          const [hh, mm] = (e as any).start_time
                            .split(':')
                            .map((n: string) => parseInt(n, 10))
                          const dt = new Date(base)
                          dt.setHours(hh, mm, 0, 0)
                          return dt
                        }
                        const dt = new Date(base)
                        dt.setHours(0, 0, 0, 0)
                        return dt
                      })()
                      const now = new Date()
                      const remaining = (() => {
                        const diffMs = target.getTime() - now.getTime()
                        if (notificationRangeUnit === 'hours')
                          return Math.ceil(diffMs / (1000 * 60 * 60))
                        if (notificationRangeUnit === 'months')
                          return Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30))
                        return Math.ceil(
                          (target.getTime() - new Date().setHours(0, 0, 0, 0)) /
                            (1000 * 60 * 60 * 24),
                        )
                      })()
                      const within =
                        remaining <= notificationRangeValue && remaining >= 0
                      return (
                        <li
                          key={e.id}
                          className="p-2 rounded border bg-accent/10 flex items-start justify-between"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium">
                                {e.title}
                              </div>
                              {within && (
                              <span className="text-[11px] px-2 py-0.5 rounded bg-destructive text-destructive-foreground">
                                Vence em {(() => {
                                  if (typeof target === 'undefined') return 'N/A'
                                  const diffMs = target.getTime() - now.getTime()
                                  if (notificationRangeUnit === 'hours')
                                    return `${Math.ceil(diffMs / (1000 * 60 * 60))}h`
                                  if (notificationRangeUnit === 'months')
                                    return `${Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30))}m`
                                  return `${Math.ceil(
                                    (target.getTime() - new Date().setHours(0, 0, 0, 0)) /
                                      (1000 * 60 * 60 * 24),
                                  )}d`
                                })()}
                              </span>
                            )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingEvent(e)
                                setIsEditEventOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                const next = events.filter((ev) => ev.id !== e.id)
                                saveEvents(next)
                                // no backend persistence required
                              }}
                            >
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
          <div className="glass-card p-4 mb-4">
            <h3 className="text-sm font-medium">Mural de Avisos</h3>
            <div className="mt-3">
              {(() => {
                const upcoming = [
                  ...tasks
                    .filter((t) => t.due_date)
                    .map((t) => {
                      const base = new Date(t.due_date as any)
                      const dt = new Date(base)
                      if ((t as any).start_time) {
                        const [hh, mm] = (t as any).start_time
                          .split(':')
                          .map((n: string) => parseInt(n, 10))
                        dt.setHours(hh, mm, 0, 0)
                      } else {
                        dt.setHours(0, 0, 0, 0)
                      }
                      return {
                        id: t.id,
                        type: 'task',
                        title: t.title,
                        date: dt,
                      }
                    }),
                  ...events.map((e) => {
                    const base = parseEventDate(e.date) || new Date()
                    const dt = new Date(base)
                    if ((e as any).start_time) {
                      const [hh, mm] = (e as any).start_time
                        .split(':')
                        .map((n: string) => parseInt(n, 10))
                      dt.setHours(hh, mm, 0, 0)
                    } else {
                      dt.setHours(0, 0, 0, 0)
                    }
                    return {
                      id: e.id,
                      type: 'event',
                      title: e.title,
                      date: dt,
                      color: e.color,
                    }
                  }),
                ]
                  .filter((item) => {
                    const now = new Date()
                    const diffMs = item.date.getTime() - now.getTime()
                    const remaining =
                      notificationRangeUnit === 'hours'
                        ? Math.ceil(diffMs / (1000 * 60 * 60))
                        : notificationRangeUnit === 'months'
                          ? Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30))
                          : Math.ceil(
                              (item.date.getTime() -
                                new Date().setHours(0, 0, 0, 0)) /
                                (1000 * 60 * 60 * 24),
                            )
                    return remaining <= notificationRangeValue && remaining >= 0
                  })
                  .sort((a, b) => +a.date - +b.date)

                if (upcoming.length === 0)
                  return (
                    <p className="text-sm text-muted-foreground">
                      Nenhum aviso no alcance selecionado.
                    </p>
                  )

                return (
                  <ul className="space-y-2">
                    {upcoming.map((u) => {
                      const daysUntil = Math.ceil(
                        (u.date.getTime() - new Date().setHours(0, 0, 0, 0)) /
                          (1000 * 60 * 60 * 24),
                      )
                      return (
                        <li
                          key={`${u.type}-${u.id}`}
                          className="flex items-center justify-between p-2 rounded border bg-accent/10"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{
                                backgroundColor:
                                  (u as any).color || highlightColor,
                              }}
                            />
                            <div>
                              <div className="text-sm font-medium">
                                {u.title}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {u.date.toLocaleDateString()} • Vence em{' '}
                                {(() => {
                                  const now = new Date()
                                  const diffMs =
                                    u.date.getTime() - now.getTime()
                                  if (notificationRangeUnit === 'hours')
                                    return `${Math.ceil(diffMs / (1000 * 60 * 60))}h`
                                  if (notificationRangeUnit === 'months')
                                    return `${Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30))}m`
                                  return `${Math.ceil(
                                    (u.date.getTime() -
                                      new Date().setHours(0, 0, 0, 0)) /
                                      (1000 * 60 * 60 * 24),
                                  )}d`
                                })()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if ((u as any).type === 'task') {
                                  const t = tasks.find((tt) => tt.id === u.id)
                                  if (t) {
                                    setEditingTask(t)
                                    setIsEditTaskOpen(true)
                                  }
                                } else {
                                  const ev = events.find((xx) => xx.id === u.id)
                                  if (ev) {
                                    setEditingEvent(ev)
                                    setIsEditEventOpen(true)
                                  }
                                }
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )
              })()}
            </div>
          </div>
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
            <UiInput
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
            />
            <Label>Data</Label>
            <Calendar
              selected={selectedDate}
              onSelect={(d) => setSelectedDate(d as Date | undefined)}
            />
            <Label>Cor (opcional)</Label>
            <input
              type="color"
              value={
                createEventColor ||
                dateColors[selectedDate?.toDateString() || ''] ||
                highlightColor
              }
              onChange={(e) => setCreateEventColor(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Início (opcional)</Label>
                <UiInput
                  type="time"
                  value={createEventStartTime}
                  onChange={(e) => setCreateEventStartTime(e.target.value)}
                />
              </div>
              <div>
                <Label>Fim (opcional)</Label>
                <UiInput
                  type="time"
                  value={createEventEndTime}
                  onChange={(e) => setCreateEventEndTime(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                variant="ghost"
                onClick={() => setIsCreateEventOpen(false)}
              >
                Cancelar
              </Button>
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
              <UiInput
                value={editingEvent.title}
                onChange={(e) =>
                  setEditingEvent({ ...editingEvent, title: e.target.value })
                }
              />
              <Label>Data</Label>
              <Calendar
                selected={parseEventDate(editingEvent.date) || undefined}
                onSelect={(d) =>
                  setEditingEvent({
                    ...editingEvent,
                    date: normalizeEventDate(d as Date) || (d as Date).toISOString(),
                  })
                }
              />
              <Label>Cor (opcional)</Label>
              <input
                type="color"
                value={
                  editingEvent.color ||
                  dateColors[(parseEventDate(editingEvent.date) || new Date()).toDateString()] ||
                  highlightColor
                }
                onChange={(e) =>
                  setEditingEvent({ ...editingEvent, color: e.target.value })
                }
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Início (opcional)</Label>
                  <UiInput
                    type="time"
                    value={(editingEvent.start_time as any) || ''}
                    onChange={(e) =>
                      setEditingEvent({
                        ...editingEvent,
                        start_time: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Fim (opcional)</Label>
                  <UiInput
                    type="time"
                    value={(editingEvent.end_time as any) || ''}
                    onChange={(e) =>
                      setEditingEvent({
                        ...editingEvent,
                        end_time: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="destructive"
                  onClick={() => {
                    const next = events.filter((ev) => ev.id !== editingEvent.id)
                    saveEvents(next)
                    setIsEditEventOpen(false)
                    setEditingEvent(null)
                  }}
                >
                  Excluir
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsEditEventOpen(false)
                    setEditingEvent(null)
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    const next = events.map((ev) => (ev.id === editingEvent.id ? editingEvent : ev))
                    saveEvents(next)
                    setIsEditEventOpen(false)
                    setEditingEvent(null)
                  }}
                >
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
export default Tarefas
