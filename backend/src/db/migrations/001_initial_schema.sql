-- DuoChat — DB schema (Deel 2).
-- Users, chats, chat-members (join) and messages.
-- Foreign keys, constraints and explicit indexes per the requirements.

-- users ---------------------------------------------------------------

CREATE TABLE users (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT users_username_len CHECK (char_length(btrim(username)) BETWEEN 1 AND 32)
);

-- The UNIQUE constraint on username creates the required username index.

-- chats ---------------------------------------------------------------

CREATE TABLE chats (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- chat_members (join table: chats ↔ users) ----------------------------
-- The composite PRIMARY KEY (chat_id, user_id) both prevents duplicate
-- members and already indexes chat_id as its leading column, so it serves
-- the required chat_id index. The explicit user_id index covers
-- "all chats of a user".

CREATE TABLE chat_members (
  chat_id BIGINT NOT NULL REFERENCES chats (id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  PRIMARY KEY (chat_id, user_id)
);

CREATE INDEX idx_chat_members_user_id ON chat_members (user_id);

-- messages -------------------------------------------------------------

CREATE TABLE messages (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  chat_id       BIGINT NOT NULL REFERENCES chats (id) ON DELETE CASCADE,
  sender_id     BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  content       TEXT   NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT messages_content_not_empty CHECK (char_length(btrim(content)) > 0)
);

CREATE INDEX idx_messages_chat_id ON messages (chat_id);
CREATE INDEX idx_messages_created_at ON messages (created_at);