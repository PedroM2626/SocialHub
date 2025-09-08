import { Client } from 'pg'

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL not set')
    process.exit(1)
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()

  try {
    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE,
        profile_image TEXT,
        cover_image TEXT,
        bio TEXT,
        posts_count INT DEFAULT 0,
        followers_count INT DEFAULT 0,
        following_count INT DEFAULT 0,
        website TEXT,
        interests JSONB
      );

      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        author_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_date TIMESTAMPTZ,
        content TEXT,
        image_url TEXT,
        hashtags JSONB,
        likes_count INT DEFAULT 0,
        comments_count INT DEFAULT 0,
        reactions JSONB,
        comments JSONB
      );

      CREATE TABLE IF NOT EXISTS communities (
        id TEXT PRIMARY KEY,
        name TEXT,
        description TEXT,
        image_url TEXT,
        members_count INT DEFAULT 0,
        is_private BOOLEAN DEFAULT FALSE,
        category TEXT,
        created_date TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT,
        color TEXT
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT,
        description TEXT,
        is_completed BOOLEAN DEFAULT FALSE,
        priority TEXT,
        is_public BOOLEAN DEFAULT TRUE,
        tags JSONB,
        due_date TIMESTAMPTZ,
        subtasks JSONB,
        backgroundColor TEXT,
        borderStyle TEXT
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        participant_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        last_message_preview TEXT,
        last_message_date TIMESTAMPTZ,
        unread_count INT DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        recipient_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        content TEXT,
        created_date TIMESTAMPTZ,
        read BOOLEAN DEFAULT FALSE
      );
    `)

    // Insert sample users
    await client.query(`
      INSERT INTO users (id, name, email, profile_image, cover_image, bio, posts_count, followers_count, following_count, website, interests)
      VALUES
      ('user-0', 'John Doe', 'john.doe@example.com', 'https://img.usecurling.com/ppl/medium?gender=male&seed=0', 'https://img.usecurling.com/p/1200/400?q=code', 'Usuário de teste para o SocialHub.', 1, 10, 5, 'https://johndoe.dev', '[]'::jsonb)
      ON CONFLICT (id) DO NOTHING;
    `)

    await client.query(`
      INSERT INTO users (id, name, email, profile_image, cover_image, bio, posts_count, followers_count, following_count)
      VALUES
      ('user-1', 'Ana Silva', 'ana.silva@example.com', 'https://img.usecurling.com/ppl/medium?gender=female&seed=1', 'https://img.usecurling.com/p/1200/400?q=abstract%20pattern', 'Apaixonada por tecnologia e café. Desenvolvedora Frontend.', 12, 150, 75)
      ON CONFLICT (id) DO NOTHING;
    `)

    await client.query(`
      INSERT INTO users (id, name, email, profile_image, cover_image, bio, posts_count, followers_count, following_count)
      VALUES
      ('user-2', 'Bruno Costa', 'bruno.costa@example.com', 'https://img.usecurling.com/ppl/medium?gender=male&seed=2', 'https://img.usecurling.com/p/1200/400?q=mountain%20landscape', 'Fotógrafo amador e viajante. Explorando o mundo uma foto de cada vez.', 34, 540, 120)
      ON CONFLICT (id) DO NOTHING;
    `)

    // Insert sample posts
    await client.query(`
      INSERT INTO posts (id, author_id, created_date, content, hashtags, likes_count, comments_count, reactions, comments)
      VALUES
      ('post-0', 'user-0', NOW() - INTERVAL '5 minutes', 'Este é o meu primeiro post no SocialHub! Animado para começar. #primeiropost', '[]'::jsonb, 2, 0, '{"👍":2}'::jsonb, '[]'::jsonb)
      ON CONFLICT (id) DO NOTHING;
    `)

    await client.query(`
      INSERT INTO posts (id, author_id, created_date, content, image_url, hashtags, likes_count, comments_count, reactions, comments)
      VALUES
      ('post-1', 'user-1', NOW() - INTERVAL '2 days', 'Um dia incrível nas montanhas! A vista daqui de cima é de tirar o fôlego. 🏔️', 'https://img.usecurling.com/p/800/600?q=snowy%20mountain%20peak', '[]'::jsonb, 123, 12, '{"❤️":50, "👍":73}'::jsonb, '[]'::jsonb)
      ON CONFLICT (id) DO NOTHING;
    `)

    // Insert sample communities
    await client.query(`
      INSERT INTO communities (id, name, description, image_url, members_count, is_private, category, created_date)
      VALUES
      ('1', 'Amantes de React', 'Tudo sobre o ecossistema React.', 'https://img.usecurling.com/p/400/200?q=react%20logo', 1200, false, 'tecnologia', NOW() - INTERVAL '1 year')
      ON CONFLICT (id) DO NOTHING;
    `)

    await client.query(`
      INSERT INTO tags (id, name, color)
      VALUES
      ('tag-1', 'ui', 'hsl(var(--chart-1))'),
      ('tag-2', 'design', 'hsl(var(--chart-2))')
      ON CONFLICT (id) DO NOTHING;
    `)

    // Insert sample conversations and messages
    await client.query(`
      INSERT INTO conversations (id, participant_id, last_message_preview, last_message_date, unread_count)
      VALUES
      ('conv-1', 'user-2', 'Oi Bruno! Obrigada! Fico feliz...', NOW() - INTERVAL '2 days', 0)
      ON CONFLICT (id) DO NOTHING;
    `)

    await client.query(`
      INSERT INTO messages (id, conversation_id, sender_id, recipient_id, content, created_date, read)
      VALUES
      ('msg-1', 'conv-1', 'user-2', 'user-1', 'Oi Ana, tudo bem? Vi seu novo portfólio, ficou incrível!', NOW() - INTERVAL '2 days', true),
      ('msg-2', 'conv-1', 'user-1', 'user-2', 'Oi Bruno! Obrigada! Fico feliz que tenha gostado 😊', NOW() - INTERVAL '2 days' + INTERVAL '5 minutes', true)
      ON CONFLICT (id) DO NOTHING;
    `)

    console.log('Database schema created and seeded successfully.')
  } catch (err) {
    console.error('Error seeding database:', err)
    process.exitCode = 1
  } finally {
    await client.end()
  }
}

main()
