import {
  Post,
  User,
  Notification,
  Community,
  Task,
  Desabafo,
  Message,
  Conversation,
  CommunityMessage,
  Tag,
} from './types'

export const users: User[] = [
  {
    id: 'user-0',
    name: 'John Doe',
    email: 'john.doe@example.com',
    profile_image: 'https://img.usecurling.com/ppl/medium?gender=male&seed=0',
    cover_image: 'https://img.usecurling.com/p/1200/400?q=code',
    bio: 'Usuário de teste para o SocialHub.',
    posts_count: 1,
    followers_count: 10,
    following_count: 5,
    website: 'https://johndoe.dev',
    interests: ['Desenvolvimento', 'Tecnologia'],
  },
  {
    id: 'user-1',
    name: 'Ana Silva',
    email: 'ana.silva@example.com',
    profile_image: 'https://img.usecurling.com/ppl/medium?gender=female&seed=1',
    cover_image: 'https://img.usecurling.com/p/1200/400?q=abstract%20pattern',
    bio: 'Apaixonada por tecnologia e café. Desenvolvedora Frontend.',
    posts_count: 12,
    followers_count: 150,
    following_count: 75,
    website: 'https://anasilva.codes',
    interests: ['Frontend', 'UI/UX', 'Café'],
  },
  {
    id: 'user-2',
    name: 'Bruno Costa',
    email: 'bruno.costa@example.com',
    profile_image: 'https://img.usecurling.com/ppl/medium?gender=male&seed=2',
    cover_image: 'https://img.usecurling.com/p/1200/400?q=mountain%20landscape',
    bio: 'Fotógrafo amador e viajante. Explorando o mundo uma foto de cada vez.',
    posts_count: 34,
    followers_count: 540,
    following_count: 120,
  },
  {
    id: 'user-3',
    name: 'Carla Dias',
    email: 'carla.dias@example.com',
    profile_image: 'https://img.usecurling.com/ppl/medium?gender=female&seed=3',
    cover_image: 'https://img.usecurling.com/p/1200/400?q=city%20at%20night',
    bio: 'Designer de UI/UX com foco em interfaces limpas e intuitivas.',
    posts_count: 5,
    followers_count: 89,
    following_count: 42,
  },
]

export const posts: Post[] = [
  {
    id: 'post-0',
    author: users[0],
    created_date: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    content:
      'Este é o meu primeiro post no SocialHub! Animado para começar. #primeiropost',
    hashtags: ['#primeiropost', '#socialhub'],
    likes_count: 2,
    comments_count: 0,
    reactions: { '👍': 2 },
    comments: [],
  },
  {
    id: 'post-1',
    author: users[1],
    created_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    content:
      'Um dia incrível nas montanhas! A vista daqui de cima é de tirar o fôlego. 🏔️',
    image_url: 'https://img.usecurling.com/p/800/600?q=snowy%20mountain%20peak',
    hashtags: ['#viagem', '#fotografia', '#natureza'],
    likes_count: 123,
    comments_count: 12,
    reactions: { '❤️': 50, '👍': 73 },
    comments: [],
  },
  {
    id: 'post-2',
    author: users[0],
    created_date: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    content:
      'Finalmente terminei o redesign do meu portfólio. O que acharam do novo layout? Feedback é sempre bem-vindo! ✨',
    hashtags: ['#dev', '#frontend', '#uidesign'],
    likes_count: 88,
    comments_count: 25,
    reactions: { '👍': 60, '❤️': 28 },
    comments: [],
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 1), // 1 hour ago
  },
  {
    id: 'post-3',
    author: users[2],
    created_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10), // 10 days ago
    content:
      'Dica de design do dia: Menos é mais. Um layout limpo ajuda o usuário a focar no que realmente importa.',
    image_url: 'https://img.usecurling.com/p/800/600?q=minimalist%20workspace',
    hashtags: ['#dica', '#design', '#ux'],
    likes_count: 215,
    comments_count: 45,
    reactions: { '👍': 200, '❤️': 15 },
    comments: [],
  },
]

export const notifications: Notification[] = []

export const communities: Community[] = [
  {
    id: '1',
    name: 'Amantes de React',
    description: 'Tudo sobre o ecossistema React.',
    image_url: 'https://img.usecurling.com/p/400/200?q=react%20logo',
    members_count: 1200,
    is_private: false,
    category: 'tecnologia',
    created_date: new Date('2023-01-15'),
  },
  {
    id: '2',
    name: 'Fotografia de Rua',
    description: 'Compartilhe suas melhores fotos urbanas.',
    image_url: 'https://img.usecurling.com/p/400/200?q=street%20photography',
    members_count: 850,
    is_private: false,
    category: 'arte',
    created_date: new Date('2022-05-20'),
  },
  {
    id: '3',
    name: 'Gamers BR',
    description: 'Comunidade para gamers brasileiros.',
    image_url: 'https://img.usecurling.com/p/400/200?q=gaming%20setup',
    members_count: 2500,
    is_private: true,
    category: 'esportes',
    created_date: new Date('2024-02-10'),
  },
]

export const tags: Tag[] = [
  { id: 'tag-1', name: 'ui', color: 'hsl(var(--chart-1))' },
  { id: 'tag-2', name: 'design', color: 'hsl(var(--chart-2))' },
  { id: 'tag-3', name: 'backend', color: 'hsl(var(--chart-3))' },
  { id: 'tag-4', name: 'api', color: 'hsl(var(--chart-4))' },
  { id: 'tag-5', name: 'frontend', color: 'hsl(var(--chart-5))' },
  { id: 'tag-6', name: 'tests', color: 'hsl(var(--primary))' },
]

export const tasks: Task[] = [
  {
    id: 'task-1',
    title: 'Redesign da página de perfil',
    description: 'Atualizar o layout para ser mais moderno e responsivo.',
    is_completed: false,
    priority: 'high',
    is_public: true,
    tags: [tags[0], tags[1]],
    due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    subtasks: [
      { id: 'sub-1-1', title: 'Criar wireframes', is_completed: true },
      {
        id: 'sub-1-2',
        title: 'Desenvolver protótipo de alta fidelidade',
        is_completed: false,
      },
      {
        id: 'sub-1-3',
        title: 'Implementar o novo layout',
        is_completed: false,
      },
    ],
    backgroundColor: 'hsl(var(--card))',
    borderStyle: 'solid',
    attachments: [
      {
        id: 'att-1',
        name: 'wireframes.pdf',
        url: '#',
        size: 1258291,
        type: 'application/pdf',
      },
      {
        id: 'att-2',
        name: 'moodboard.png',
        url: 'https://img.usecurling.com/p/400/300?q=moodboard',
        size: 524288,
        type: 'image/png',
      },
    ],
    titleAlignment: 'left',
    descriptionAlignment: 'left',
  },
  {
    id: 'task-2',
    title: 'Implementar API de mensagens',
    description: 'Criar endpoints para envio e recebimento de mensagens.',
    is_completed: false,
    priority: 'urgent',
    is_public: false,
    tags: [tags[2], tags[3]],
    due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
    subtasks: [],
    backgroundColor: 'hsl(var(--destructive) / 0.1)',
    borderStyle: 'dashed',
    attachments: [],
    titleAlignment: 'center',
    descriptionAlignment: 'left',
  },
  {
    id: 'task-3',
    title: 'Escrever testes para componente de Post',
    description:
      'Garantir que o componente PostCard está funcionando como esperado.',
    is_completed: true,
    priority: 'medium',
    is_public: false,
    tags: [tags[4], tags[5]],
    due_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    subtasks: [
      { id: 'sub-3-1', title: 'Teste de renderização', is_completed: true },
      {
        id: 'sub-3-2',
        title: 'Teste de interação (like, comment)',
        is_completed: true,
      },
    ],
    backgroundColor: 'hsl(var(--primary) / 0.1)',
    borderStyle: 'dotted',
    attachments: [
      {
        id: 'att-3',
        name: 'test-plan.docx',
        url: '#',
        size: 45056,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
    ],
    titleAlignment: 'left',
    descriptionAlignment: 'right',
  },
]

export const desabafos: Desabafo[] = [
  {
    id: 'desabafo-1',
    user_id: 'user-0',
    created_date: new Date(Date.now() - 1000 * 60 * 30),
    content:
      'Às vezes sinto que estou correndo em círculos e não chego a lugar nenhum na minha carreira.',
    reactions: { '😢': 15, '❤️': 5 },
    comments: [],
    hashtags: ['#carreira', '#desmotivado'],
    updated_at: new Date(Date.now() - 1000 * 60 * 15),
  },
  {
    id: 'desabafo-2',
    user_id: 'user-1',
    created_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    content:
      'É tão bom quando um pequeno gesto de gentileza de um estranho melhora seu dia.',
    reactions: { '❤️': 52, '👍': 10 },
    comments: [
      {
        id: 'dc-1',
        content: 'Verdade!',
        created_date: new Date(),
        reactions: {},
      },
    ],
    hashtags: ['#gentileza', '#felicidade'],
  },
]

export const messages: Message[] = [
  {
    id: 'msg-1',
    sender_id: 'user-2',
    recipient_id: 'user-1',
    content: 'Oi Ana, tudo bem? Vi seu novo portfólio, ficou incrível!',
    created_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    read: true,
  },
  {
    id: 'msg-2',
    sender_id: 'user-1',
    recipient_id: 'user-2',
    content: 'Oi Bruno! Obrigada! Fico feliz que tenha gostado 😊',
    created_date: new Date(
      Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 5,
    ),
    read: true,
  },
  {
    id: 'msg-3',
    sender_id: 'user-3',
    recipient_id: 'user-1',
    content: 'Olá! Adorei seus posts sobre design. Podemos conversar?',
    created_date: new Date(Date.now() - 1000 * 60 * 60 * 8),
    read: false,
  },
]

export const communityMessages: CommunityMessage[] = [
  {
    id: 'cmsg-1',
    community_id: '1',
    author: users[1],
    content: 'E aí, pessoal! Alguém já testou o novo hook `useFormState`?',
    created_date: new Date(Date.now() - 1000 * 60 * 60 * 3),
  },
  {
    id: 'cmsg-2',
    community_id: '1',
    author: users[3],
    content: 'Ainda não, mas parece promissor! Vi um vídeo sobre ele ontem.',
    created_date: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: 'cmsg-3',
    community_id: '1',
    author: users[0],
    content:
      'Estou usando em um projeto pessoal. Facilita muito o feedback de formulários.',
    created_date: new Date(Date.now() - 1000 * 60 * 30),
    reactions: { '👍': 2 },
  },
]

export const conversations: Conversation[] = [
  {
    id: 'conv-1',
    participant: users[2],
    last_message_preview: 'Oi Bruno! Obrigada! Fico feliz...',
    last_message_date: new Date(
      Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 5,
    ),
    unread_count: 0,
  },
  {
    id: 'conv-2',
    participant: users[3],
    last_message_preview: 'Olá! Adorei seus posts sobre design...',
    last_message_date: new Date(Date.now() - 1000 * 60 * 60 * 8),
    unread_count: 1,
  },
]
