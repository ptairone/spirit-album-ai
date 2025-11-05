-- Atualizar o limite de tamanho de arquivo para 900MB (943718400 bytes)
UPDATE storage.buckets
SET file_size_limit = 943718400
WHERE id = 'event-media';