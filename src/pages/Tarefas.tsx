import { useState, useMemo, useRef } from 'react'
import {
  Plus,
  Search,
  Filter,
  CheckCircle,
  ListTodo,
  AlertTriangle,
  Upload,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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

  const handleCreateTask = (data: TaskFormValues) => {
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
    setTasks((prev) => [newTask, ...prev])
    setIsCreateModalOpen(false)
    toast({ title: 'Sucesso!', description: 'Tarefa criada com sucesso.' })
  }

  const handleUpdateTask = (taskId: string, data: TaskFormValues) => {
    const updatedAttachments =
      data.attachments?.map((att) => ({
        id: att.id,
        name: att.name,
        url: att.url,
        size: att.size,
        type: att.type,
      })) || []

    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
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
          : task,
      ),
    )
    toast({ title: 'Sucesso!', description: 'Tarefa atualizada com sucesso.' })
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId))
    toast({
      variant: 'destructive',
      title: 'Tarefa excluída!',
      description: 'A tarefa foi removida da sua lista.',
    })
  }

  const toggleCompletion = (taskId: string, subtaskIdToToggle?: string) => {
    const toggleAndPropagate = (
      subtasks: Subtask[],
      isChecking: boolean,
    ): Subtask[] => {
      return subtasks.map((sub) => ({
        ...sub,
        is_completed: isChecking,
        subtasks: sub.subtasks
          ? toggleAndPropagate(sub.subtasks, isChecking)
          : [],
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
              ? toggleAndPropagate(sub.subtasks, newIsCompleted)
              : [],
          }
        }
        if (sub.subtasks) {
          return { ...sub, subtasks: findAndToggle(sub.subtasks) }
        }
        return sub
      })
    }

    const updateParents = (subtasks: Subtask[]): Subtask[] => {
      return subtasks.map((sub) => {
        if (sub.subtasks && sub.subtasks.length > 0) {
          const updatedChildren = updateParents(sub.subtasks)
          const allChildrenCompleted = updatedChildren.every(
            (child) => child.is_completed,
          )
          return {
            ...sub,
            subtasks: updatedChildren,
            is_completed: allChildrenCompleted,
          }
        }
        return sub
      })
    }

    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id !== taskId) return task

        if (!subtaskIdToToggle) {
          const newIsCompleted = !task.is_completed
          return {
            ...task,
            is_completed: newIsCompleted,
            subtasks: toggleAndPropagate(task.subtasks, newIsCompleted),
          }
        }

        let tempSubtasks = findAndToggle(task.subtasks)
        let updatedSubtasks = updateParents(tempSubtasks)

        const allTopLevelSubtasksCompleted = updatedSubtasks.every(
          (s) => s.is_completed,
        )

        return {
          ...task,
          subtasks: updatedSubtasks,
          is_completed:
            task.subtasks.length > 0 ? allTopLevelSubtasksCompleted : false,
        }
      }),
    )
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
  )
}
export default Tarefas
