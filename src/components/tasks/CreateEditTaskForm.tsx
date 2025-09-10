import { useForm, useFieldArray, Controller, Control } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  CalendarIcon,
  Plus,
  Trash2,
  Upload,
  Paperclip,
  X,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Task, TaskBorderStyle, Attachment, Subtask, Tag } from '@/lib/types'
import { cn } from '@/lib/utils'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { Separator } from '../ui/separator'
import { RichTextInput } from '../ui/RichTextInput'
import { Input } from '../ui/input'
import { useEffect, useRef, useState } from 'react'
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group'
import { TagInput } from './TagInput'
import { tags as mockTags } from '@/lib/mock-data'
import { Checkbox } from '@/components/ui/checkbox'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const attachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  size: z.number(),
  type: z.string(),
  file: z.instanceof(File).optional(),
})

const subtaskSchema: z.ZodType<Omit<Subtask, 'id'> & { id?: string }> = z.lazy(
  () =>
    z.object({
      id: z.string().optional(),
      title: z.string().min(1, 'Subtarefa não pode ser vazia.'),
      is_completed: z.boolean(),
      is_optional: z.boolean().optional(),
      subtasks: z.array(subtaskSchema).optional(),
    }),
)

const tagSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
})

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/

const taskSchema = z.object({
  title: z
    .string()
    .min(10, { message: 'O título deve ter pelo menos 3 caracteres.' }),
  description: z.string().optional(),
  due_date: z.date().optional(),
  start_time: z.string().regex(timeRegex, 'Formato HH:MM').optional().or(z.literal('')),
  end_time: z.string().regex(timeRegex, 'Formato HH:MM').optional().or(z.literal('')),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  tags: z.array(tagSchema).optional(),
  subtasks: z.array(subtaskSchema).optional(),
  attachments: z.array(attachmentSchema).optional(),
  backgroundColor: z.string(),
  borderStyle: z.enum([
    'none',
    'solid',
    'dashed',
    'dotted',
    'double',
    'groove',
    'ridge',
    'inset',
    'outset',
  ]),
  titleAlignment: z.enum(['left', 'center', 'right']).optional(),
  descriptionAlignment: z.enum(['left', 'center', 'right']).optional(),
})

export type TaskFormValues = z.infer<typeof taskSchema>

interface CreateEditTaskFormProps {
  task?: Task
  onSubmit: (data: TaskFormValues) => void
  onCancel: () => void
}

const borderStyles: TaskBorderStyle[] = [
  'solid',
  'dashed',
  'dotted',
  'double',
  'none',
]
const colorPalette = [
  'hsl(var(--card))',
  'hsl(var(--primary) / 0.1)',
  'hsl(var(--destructive) / 0.1)',
  'hsl(var(--chart-1) / 0.1)',
  'hsl(var(--chart-5) / 0.1)',
]

interface SubtaskFieldsProps {
  control: Control<TaskFormValues>
  nestingLevel: number
  fieldName: `subtasks` | `subtasks.${number}.subtasks`
}

const SubtaskFields = ({
  control,
  nestingLevel,
  fieldName,
}: SubtaskFieldsProps) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: fieldName,
  })

  if (nestingLevel >= 3) return null

  return (
    <div
      className="space-y-2 pl-4 border-l-2 border-border/30"
      style={{ marginLeft: `${nestingLevel * 10}px` }}
    >
      {fields.map((field, index) => (
        <div key={field.id}>
          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name={`${fieldName}.${index}.title`}
              render={({ field }) => (
                <RichTextInput
                  {...field}
                  placeholder={`Subtarefa (Nível ${nestingLevel + 1})`}
                />
              )}
            />
            <div className="flex items-center gap-2">
              <Controller
                control={control}
                name={`${fieldName}.${index}.is_optional`}
                render={({ field }) => (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={!!field.value}
                      onCheckedChange={(v) => field.onChange(!!v)}
                      id={`${fieldName}.${index}.is_optional`}
                    />
                    <label
                      htmlFor={`${fieldName}.${index}.is_optional`}
                      className="text-xs text-muted-foreground"
                    >
                      Opcional
                    </label>
                  </div>
                )}
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => remove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <SubtaskFields
            control={control}
            nestingLevel={nestingLevel + 1}
            fieldName={`${fieldName}.${index}.subtasks`}
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          append({
            title: '',
            is_completed: false,
            is_optional: false,
            id: `new-${Date.now()}`,
            subtasks: [],
          })
        }
      >
        <Plus className="mr-2 h-4 w-4" /> Adicionar Subtarefa
      </Button>
    </div>
  )
}

export const CreateEditTaskForm = ({
  task,
  onSubmit,
  onCancel,
}: CreateEditTaskFormProps) => {
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      due_date: task?.due_date ? new Date(task.due_date) : undefined,
      start_time: task?.start_time || '',
      end_time: task?.end_time || '',
      priority: task?.priority || 'medium',
      tags: task?.tags || [],
      subtasks: task?.subtasks || [],
      attachments: task?.attachments || [],
      backgroundColor: task?.backgroundColor || 'hsl(var(--card))',
      borderStyle: task?.borderStyle || 'solid',
      titleAlignment: task?.titleAlignment || 'left',
      descriptionAlignment: task?.descriptionAlignment || 'left',
    },
  })

  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title || '',
        description: task.description || '',
        due_date: task.due_date ? new Date(task.due_date) : undefined,
        start_time: task.start_time || '',
        end_time: task.end_time || '',
        priority: task.priority || 'medium',
        tags: task.tags || [],
        subtasks: task.subtasks || [],
        attachments: task.attachments || [],
        backgroundColor: task.backgroundColor || 'hsl(var(--card))',
        borderStyle: task.borderStyle || 'solid',
        titleAlignment: task.titleAlignment || 'left',
        descriptionAlignment: task.descriptionAlignment || 'left',
      })
    }
  }, [task])

  const {
    fields: attachmentFields,
    append: appendAttachment,
    remove: removeAttachment,
  } = useFieldArray({
    control: form.control,
    name: 'attachments',
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [availableTags, setAvailableTags] = useState<Tag[]>(mockTags)

  const handleTagCreate = (tag: Omit<Tag, 'id'>): Tag => {
    const newTag = { ...tag, id: `tag-${Date.now()}` }
    setAvailableTags((prev) => [...prev, newTag])
    return newTag
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        form.setError('attachments', {
          type: 'manual',
          message: `O arquivo ${file.name} excede o limite de 10MB.`,
        })
        return
      }
      const newAttachment: Attachment & { file: File } = {
        id: `new-${Date.now()}-${file.name}`,
        name: file.name,
        url: URL.createObjectURL(file),
        size: file.size,
        type: file.type,
        file: file,
      }
      appendAttachment(newAttachment)
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <RichTextInput {...field} placeholder="Título da tarefa..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <RichTextInput
                  {...field}
                  placeholder="Adicione mais detalhes..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prioridade</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a prioridade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="due_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Prazo</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground',
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP', { locale: ptBR })
                        ) : (
                          <span>Escolha uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Início (opcional)</FormLabel>
                <FormControl>
                  <Input type="time" value={field.value || ''} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="end_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fim (opcional)</FormLabel>
                <FormControl>
                  <Input type="time" value={field.value || ''} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <FormControl>
                <TagInput
                  value={field.value || []}
                  onChange={field.onChange}
                  availableTags={availableTags}
                  onTagCreate={handleTagCreate}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Separator />
        <div>
          <FormLabel>Subtarefas</FormLabel>
          <div className="space-y-2 mt-2">
            <SubtaskFields
              control={form.control}
              nestingLevel={0}
              fieldName="subtasks"
            />
          </div>
        </div>
        <Separator />
        <div>
          <FormLabel>Anexos</FormLabel>
          <div className="space-y-2 mt-2">
            {attachmentFields.map((field, index) => (
              <div
                key={field.id}
                className="flex items-center justify-between gap-2 p-2 rounded-md border bg-accent"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <Paperclip className="h-4 w-4 flex-shrink-0" />
                  <a
                    href={field.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium truncate hover:underline"
                  >
                    {field.name}
                  </a>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    ({(field.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeAttachment(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" /> Adicionar Arquivo
            </Button>
            <input
              type="file"
              multiple
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileSelect}
            />
            <p className="text-xs text-muted-foreground">
              Tamanho máximo por arquivo: 10MB.
            </p>
            <FormMessage>
              {form.formState.errors.attachments?.message}
            </FormMessage>
          </div>
        </div>
        <Separator />
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="titleAlignment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alinhamento do Título</FormLabel>
                  <FormControl>
                    <ToggleGroup
                      type="single"
                      value={field.value}
                      onValueChange={field.onChange}
                      defaultValue="left"
                      className="w-full"
                    >
                      <ToggleGroupItem value="left" className="w-full">
                        <AlignLeft className="h-4 w-4" />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="center" className="w-full">
                        <AlignCenter className="h-4 w-4" />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="right" className="w-full">
                        <AlignRight className="h-4 w-4" />
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="descriptionAlignment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alinhamento da Descrição</FormLabel>
                  <FormControl>
                    <ToggleGroup
                      type="single"
                      value={field.value}
                      onValueChange={field.onChange}
                      defaultValue="left"
                      className="w-full"
                    >
                      <ToggleGroupItem value="left" className="w-full">
                        <AlignLeft className="h-4 w-4" />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="center" className="w-full">
                        <AlignCenter className="h-4 w-4" />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="right" className="w-full">
                        <AlignRight className="h-4 w-4" />
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="backgroundColor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cor de Fundo</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-wrap gap-2"
                    >
                      {colorPalette.map((color) => (
                        <FormItem key={color}>
                          <FormControl>
                            <RadioGroupItem
                              value={color}
                              className="sr-only"
                              id={`color-${color}`}
                            />
                          </FormControl>
                          <FormLabel
                            htmlFor={`color-${color}`}
                            className={cn(
                              'h-8 w-8 rounded-full block cursor-pointer border-2',
                              field.value === color && 'ring-2 ring-ring',
                            )}
                            style={{ backgroundColor: color }}
                          />
                        </FormItem>
                      ))}
                    </RadioGroup>
                    <Input
                      type="color"
                      value={field.value}
                      onChange={field.onChange}
                      className="w-10 h-10 p-1"
                    />
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="borderStyle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estilo da Borda</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estilo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {borderStyles.map((style) => (
                      <SelectItem key={style} value={style}>
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">Salvar Tarefa</Button>
        </div>
      </form>
    </Form>
  )
}
