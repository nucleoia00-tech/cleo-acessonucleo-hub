import { z } from 'zod';

// Validation schemas for forms
export const signupSchema = z.object({
  nome: z.string()
    .min(2, { message: "Nome deve ter no mínimo 2 caracteres" })
    .max(100, { message: "Nome deve ter no máximo 100 caracteres" })
    .trim(),
  email: z.string()
    .email({ message: "Email inválido" })
    .max(255, { message: "Email deve ter no máximo 255 caracteres" })
    .trim()
    .toLowerCase(),
  senha: z.string()
    .min(8, { message: "Senha deve ter no mínimo 8 caracteres" })
    .max(128, { message: "Senha deve ter no máximo 128 caracteres" })
    .regex(/[A-Z]/, { message: "Senha deve conter pelo menos uma letra maiúscula" })
    .regex(/[a-z]/, { message: "Senha deve conter pelo menos uma letra minúscula" })
    .regex(/[0-9]/, { message: "Senha deve conter pelo menos um número" }),
  confirmarSenha: z.string()
}).refine((data) => data.senha === data.confirmarSenha, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
});

export const loginSchema = z.object({
  email: z.string()
    .email({ message: "Email inválido" })
    .max(255, { message: "Email deve ter no máximo 255 caracteres" })
    .trim()
    .toLowerCase(),
  senha: z.string()
    .min(1, { message: "Senha é obrigatória" })
    .max(128, { message: "Senha deve ter no máximo 128 caracteres" })
});

export const credenciaisSchema = z.object({
  email_login: z.string()
    .email({ message: "Email inválido" })
    .max(255, { message: "Email deve ter no máximo 255 caracteres" })
    .trim(),
  senha_atual: z.string()
    .min(1, { message: "Senha é obrigatória" })
    .max(255, { message: "Senha deve ter no máximo 255 caracteres" })
});

export const assinanteUpdateSchema = z.object({
  nome: z.string()
    .min(2, { message: "Nome deve ter no mínimo 2 caracteres" })
    .max(100, { message: "Nome deve ter no máximo 100 caracteres" })
    .trim(),
  email: z.string()
    .email({ message: "Email inválido" })
    .max(255, { message: "Email deve ter no máximo 255 caracteres" })
    .trim()
    .toLowerCase(),
  status: z.enum(['pendente', 'ativo', 'suspenso', 'rejeitado']),
  plano: z.string()
    .max(100, { message: "Plano deve ter no máximo 100 caracteres" })
    .trim()
    .optional(),
  data_expiracao: z.string().optional(),
  observacao_admin: z.string()
    .max(1000, { message: "Observação deve ter no máximo 1000 caracteres" })
    .trim()
    .optional()
});
