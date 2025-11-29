-- Habilitar realtime para a tabela assinantes
ALTER TABLE public.assinantes REPLICA IDENTITY FULL;

-- Adicionar a tabela à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.assinantes;