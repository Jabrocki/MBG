CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE "embedding_documents" (
    "id" TEXT NOT NULL,
    "collection" VARCHAR(32) NOT NULL,
    "source_path" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content_hash" CHAR(64) NOT NULL,
    "model" TEXT NOT NULL,
    "task_prefix" VARCHAR(64) NOT NULL,
    "dimensions" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "embedding_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "embedding_chunks" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "content_hash" CHAR(64) NOT NULL,
    "embedding" vector(512) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "embedding_chunks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "embedding_chunks_document_id_fkey"
      FOREIGN KEY ("document_id") REFERENCES "embedding_documents"("id")
      ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "embedding_documents_collection_source_path_content_hash_key"
  ON "embedding_documents"("collection", "source_path", "content_hash");
CREATE INDEX "embedding_documents_collection_idx" ON "embedding_documents"("collection");
CREATE UNIQUE INDEX "embedding_chunks_document_id_chunk_index_content_hash_key"
  ON "embedding_chunks"("document_id", "chunk_index", "content_hash");
CREATE INDEX "embedding_chunks_document_id_idx" ON "embedding_chunks"("document_id");
CREATE INDEX "embedding_chunks_embedding_hnsw_cosine_idx"
  ON "embedding_chunks" USING hnsw ("embedding" vector_cosine_ops);
