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

type DropPosition = 'before' | 'after' | 'into'

interface SubtaskListProps {
  items: Subtask[]
  taskId: string
  onToggleCompletion: (taskId: string, subtaskId?: string) => void
  path: number[]
  onMove: (fromPath: number[], toPath: number[], position: DropPosition) => void
}

const SubtaskList = ({ items, taskId, onToggleCompletion, path, onMove }: SubtaskListProps) => {
  const handleDragStart = (e: React.DragEvent, currentPath: number[], id: string) => {
    e.stopPropagation()
    e.dataTransfer.setData('application/x-subtask-path', JSON.stringify({ path: currentPath, id }))
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }
  const handleDropOnItem = (e: React.DragEvent, targetPath: number[]) => {
    e.preventDefault()
    e.stopPropagation()
    const data = e.dataTransfer.getData('application/x-subtask-path')
    if (!data) return
    const { path: fromPath } = JSON.parse(data)
    // Prevent dropping into itself or its descendants
    const isAncestor = fromPath.length <= targetPath.length && fromPath.every((n: number, i: number) => n === targetPath[i])
    if (isAncestor) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const offsetY = e.clientY - rect.top
    const ratio = offsetY / rect.height
    const position: DropPosition = ratio < 0.25 ? 'before' : ratio > 0.75 ? 'after' : 'into'
    onMove(fromPath, targetPath, position)
  }
  const handleDropOnListEnd = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const data = e.dataTransfer.getData('application/x-subtask-path')
    if (!data) return
    const { path: fromPath } = JSON.parse(data)
    // Drop at end of this list (as sibling within this list)
    const targetPath = [...path, Math.max(0, items.length - 1)]
    onMove(fromPath, targetPath, 'after')
  }

  return (
    <div className="space-y-2 pl-4 border-l-2 border-border/30">
      {items.map((subtask, idx) => {
        const currentPath = [...path, idx]
        return (
          <div
            key={subtask.id}
            draggable
            onDragStart={(e) => handleDragStart(e, currentPath, subtask.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropOnItem(e, currentPath)}
          >
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
                  items={subtask.subtasks}
                  taskId={taskId}
                  onToggleCompletion={onToggleCompletion}
                  path={currentPath}
                  onMove={onMove}
                />
              </div>
            )}
          </div>
        )
      })}
      <div
        className="h-4"
        onDragOver={handleDragOver}
        onDrop={handleDropOnListEnd}
      />
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

  // Utilities to move subtasks between hierarchical levels
  const deepClone = (arr: Subtask[]): Subtask[] => arr.map((s) => ({ ...s, subtasks: s.subtasks ? deepClone(s.subtasks) : [] }))
  const removeAtPath = (root: Subtask[], path: number[]): { removed: Subtask; root: Subtask[] } => {
    const next = deepClone(root)
    const walk = (list: Subtask[], p: number[]): { removed: Subtask } => {
      const [head, ...rest] = p
      if (rest.length === 0) {
        const [removed] = list.splice(head, 1)
        return { removed }
      }
      const node = list[head]
      if (!node.subtasks) node.subtasks = []
      const res = walk(node.subtasks, rest)
      node.subtasks = node.subtasks
      return res
    }
    const { removed } = walk(next, path)
    return { removed, root: next }
  }
  const insertBeforeAfter = (root: Subtask[], targetPath: number[], item: Subtask, after = false): Subtask[] => {
    const next = deepClone(root)
    const parentPath = targetPath.slice(0, -1)
    const index = targetPath[targetPath.length - 1]
    const walk = (list: Subtask[], p: number[]) => {
      if (p.length === 0) {
        const pos = after ? index + 1 : index
        list.splice(pos, 0, item)
        return
      }
      const [head, ...rest] = p
      const node = list[head]
      if (!node.subtasks) node.subtasks = []
      walk(node.subtasks, rest)
    }
    walk(next, parentPath)
    return next
  }
  const insertInto = (root: Subtask[], targetPath: number[], item: Subtask): Subtask[] => {
    const next = deepClone(root)
    const walk = (list: Subtask[], p: number[]) => {
      const [head, ...rest] = p
      if (rest.length === 0) {
        const node = list[head]
        node.subtasks = node.subtasks ? [...node.subtasks, item] : [item]
        return
      }
      const node = list[head]
      if (!node.subtasks) node.subtasks = []
      walk(node.subtasks, rest)
    }
    walk(next, targetPath)
    return next
  }
  const findPathById = (list: Subtask[], id: string, base: number[] = []): number[] | null => {
    for (let i = 0; i < list.length; i++) {
      const s = list[i]
      const path = [...base, i]
      if (s.id === id) return path
      if (s.subtasks) {
        const child = findPathById(s.subtasks, id, path)
        if (child) return child
      }
    }
    return null
  }
  const moveSubtask = (root: Subtask[], fromPath: number[], toPath: number[], position: 'before' | 'after' | 'into'): Subtask[] => {
    const { removed, root: without } = removeAtPath(root, fromPath)
    // Re-locate target path by id in the new tree (safer for same-parent moves)
    const targetId = (() => {
      let node: Subtask | null = null
      const getByPath = (list: Subtask[], p: number[]): Subtask | null => {
        const [h, ...r] = p
        const n = list[h]
        if (!n) return null
        return r.length === 0 ? n : getByPath(n.subtasks || [], r)
      }
      node = getByPath(root, toPath)
      return node?.id || ''
    })()
    let targetPathInNew = targetId ? findPathById(without, targetId) || toPath : toPath
    if (!targetPathInNew || targetPathInNew.length === 0) {
      // Fallback: append to root
      return [...without, removed]
    }
    if (position === 'into') return insertInto(without, targetPathInNew, removed)
    if (position === 'before') return insertBeforeAfter(without, targetPathInNew, removed, false)
    return insertBeforeAfter(without, targetPathInNew, removed, true)
  }

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
        <DialogContent full className="glass-card">
          <DialogHeader>
            <DialogTitle>{/* title */}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className={cn('text-lg font-medium', titleAlignClass)} dangerouslySetInnerHTML={{ __html: task.title }} />
              <div className={cn('text-sm text-muted-foreground mt-1', descriptionAlignClass)} dangerouslySetInnerHTML={{ __html: task.description }} />
            </div>

            {task.subtasks.length > 0 && (
              <div>
                <h4 className="text-sm font-medium">Subtarefas</h4>
                <div className="mt-2">
                  <SubtaskList
                    items={task.subtasks}
                    taskId={task.id}
                    onToggleCompletion={onToggleCompletion}
                    path={[]}
                    onMove={(from, to, pos) => {
                      const next = moveSubtask(task.subtasks, from, to, pos)
                      onReorderSubtasks && onReorderSubtasks(task.id, next)
                    }}
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
