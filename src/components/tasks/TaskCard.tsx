import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Task, Subtask } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '../ui/button'
import { Edit, MoreVertical, Paperclip, Download, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog'
import { CreateEditTaskForm, TaskFormValues } from './CreateEditTaskForm'
import { Progress } from '../ui/progress'
import { Separator } from '../ui/separator'

interface TaskCardProps {
  task: Task
  onUpdate: (taskId: string, data: TaskFormValues) => void
  onToggleCompletion: (taskId: string, subtaskId?: string) => void
  onDelete: (taskId: string) => void
  onReorderSubtasks?: (taskId: string, next: Subtask[]) => void
}

const priorityVariant: Record<Task['priority'], string> = {
  low: 'bg-blue-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
}

interface SubtaskListProps {
  subtasks: Subtask[]
  taskId: string
  onToggleCompletion: (taskId: string, subtaskId?: string) => void
  nestingLevel: number
}

const SubtaskList = ({
  subtasks,
  taskId,
  onToggleCompletion,
  nestingLevel,
  onReorder,
}: SubtaskListProps & { onReorder?: (next: Subtask[]) => void }) => {
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/subtask-index', String(index))
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }
  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    const src = e.dataTransfer.getData('text/subtask-index')
    if (!src) return
    const from = parseInt(src, 10)
    const to = targetIndex
    if (isNaN(from) || isNaN(to) || from === to) return
    const next = [...subtasks]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onReorder && onReorder(next)
  }

  return (
    <div
      className="space-y-2 pl-4 border-l-2 border-border/30"
      style={{ marginLeft: `${nestingLevel * 10}px` }}
    >
      {subtasks.map((subtask, idx) => (
        <div key={subtask.id} draggable={nestingLevel === 0} onDragStart={(e) => nestingLevel === 0 && handleDragStart(e, idx)} onDragOver={(e) => nestingLevel === 0 && handleDragOver(e)} onDrop={(e) => nestingLevel === 0 && handleDrop(e, idx)}>
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`subtask-${subtask.id}`}
              checked={subtask.is_completed}
              onCheckedChange={() => onToggleCompletion(taskId, subtask.id)}
            />
            <label
              htmlFor={`subtask-${subtask.id}`}
              className={cn(
                'text-sm prose prose-sm dark:prose-invert max-w-full',
                subtask.is_completed && 'line-through text-muted-foreground',
              )}
              dangerouslySetInnerHTML={{ __html: subtask.title }}
            />
          </div>
          {subtask.subtasks && subtask.subtasks.length > 0 && (
            <div className="mt-2">
              <SubtaskList
                subtasks={subtask.subtasks}
                taskId={taskId}
                onToggleCompletion={onToggleCompletion}
                nestingLevel={nestingLevel + 1}
                onReorder={undefined}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export const TaskCard = ({
  task,
  onUpdate,
  onToggleCompletion,
  onDelete,
}: TaskCardProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)

  const handleUpdate = (data: TaskFormValues) => {
    onUpdate(task.id, data)
    setIsEditModalOpen(false)
    setIsViewOpen(false)
  }

  const calculateProgress = (
    subtasks: Subtask[],
  ): { total: number; completed: number } => {
    let total = subtasks.length
    let completed = subtasks.filter((s) => s.is_completed).length

    subtasks.forEach((sub) => {
      if (sub.subtasks) {
        const nestedProgress = calculateProgress(sub.subtasks)
        total += nestedProgress.total
        completed += nestedProgress.completed
      }
    })
    return { total, completed }
  }

  const { total, completed } = calculateProgress(task.subtasks)
  const progress =
    total > 0 ? (completed / total) * 100 : task.is_completed ? 100 : 0

  const alignMap: Record<string, string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }
  const titleAlignClass = alignMap[task.titleAlignment || 'left']
  const descriptionAlignClass = alignMap[task.descriptionAlignment || 'left']

  // Render a compact, fixed-height card. Clicking opens a modal with full details.
  return (
    <AlertDialog>
      <div className="h-48">
        <Card
          className={cn(
            'glass-card interactive-card flex flex-col border h-full overflow-hidden cursor-pointer',
            task.is_completed && 'opacity-60',
          )}
          style={{
            backgroundColor: task.backgroundColor,
            borderStyle: task.borderStyle,
            borderColor: 'hsl(var(--border))',
          }}
          onClick={() => setIsViewOpen(true)}
        >
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle
              className={cn(
                'text-base font-medium pr-2 prose prose-sm dark:prose-invert max-w-full w-full truncate',
                titleAlignClass,
              )}
              dangerouslySetInnerHTML={{ __html: task.title }}
            />
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => { setIsEditModalOpen(true); }}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      className="text-destructive"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div
              className={cn(
                'text-sm text-muted-foreground flex-1 prose prose-sm dark:prose-invert max-w-full overflow-hidden',
                descriptionAlignClass,
              )}
              style={{ maxHeight: 48 }}
              dangerouslySetInnerHTML={{ __html: task.description }}
            />

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge
                  className={cn('text-white', priorityVariant[task.priority])}
                >
                  {task.priority}
                </Badge>
                {task.attachments.length > 0 && (
                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <Paperclip className="h-4 w-4" />
                    <span>{task.attachments.length}</span>
                  </div>
                )}
                {task.subtasks.length > 0 && (
                  <div className="text-sm text-muted-foreground">{total} subtarefas</div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex -space-x-1">
                  {task.tags.slice(0, 3).map((tag) => (
                    <Badge
                      key={tag.id}
                      style={{
                        backgroundColor: tag.color,
                        color: 'hsl(var(--primary-foreground))',
                      }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">{Math.round(progress)}%</div>
              </div>
            </div>

            <div className="mt-3 flex items-center space-x-2">
              <Checkbox
                checked={task.is_completed}
                id={`task-${task.id}`}
                onCheckedChange={() => onToggleCompletion(task.id)}
                onClick={(e) => e.stopPropagation()}
              />
              <label
                htmlFor={`task-${task.id}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                onClick={(e) => e.stopPropagation()}
              >
                Concluída
              </label>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View dialog with full details */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="glass-card max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{/* title */}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium" dangerouslySetInnerHTML={{ __html: task.title }} />
              <div className="text-sm text-muted-foreground mt-1" dangerouslySetInnerHTML={{ __html: task.description }} />
            </div>

            {task.subtasks.length > 0 && (
              <div>
                <h4 className="text-sm font-medium">Subtarefas</h4>
                <div className="mt-2">
                  <SubtaskList
                  subtasks={task.subtasks}
                  taskId={task.id}
                  onToggleCompletion={onToggleCompletion}
                  nestingLevel={0}
                  onReorder={(next) => onReorderSubtasks && onReorderSubtasks(task.id, next)}
                />
                </div>
              </div>
            )}

            {task.attachments.length > 0 && (
              <div>
                <h4 className="text-sm font-medium">Anexos</h4>
                <div className="mt-2 space-y-2">
                  {task.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-2 p-2 rounded-md border bg-accent/50 hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Paperclip className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm font-medium truncate">
                          {attachment.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-muted-foreground">({(attachment.size / 1024 / 1024).toFixed(2)} MB)</span>
                        <Download className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className={cn('text-white', priorityVariant[task.priority])}>{task.priority}</Badge>
                <div className="text-sm text-muted-foreground">{total} subtarefas • {task.attachments.length} anexos</div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setIsEditModalOpen(true); setIsViewOpen(false); }}>Editar</Button>
                <Button variant="destructive" onClick={() => onDelete(task.id)}>Excluir</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="glass-card max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Tarefa</DialogTitle>
          </DialogHeader>
          <CreateEditTaskForm
            task={task}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Isso excluirá permanentemente esta
            tarefa.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => onDelete(task.id)}>
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
