import { api } from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PerfilCliente {
  id:        string;
  name:      string;
  email:     string;
  avatarUrl: string | null;
  objetivo:  string | null;
  plano:     string | null;
  status:    string;
  createdAt: string;
}

export interface PlanoInfo {
  planoAtual:   string;
  preco:        string;
  periodo:      string;
  features:     string[];
  membrosDesde: string; // ISO8601
}

export interface NotifPrefs {
  clienteId:          string;
  confirmacao:        boolean;
  lembrete:           boolean;
  cancelamento:       boolean;
  novosProfissionais: boolean;
  dicas:              boolean;
  canalEmail:         boolean;
  canalWhatsapp:      boolean;
  canalPush:          boolean;
  updatedAt:          string;
}

export interface UpdatePerfilPayload {
  name?:     string;
  email?:    string;
  phone?:    string;
  username?: string;
  objetivo?: string;
}

export interface UpdateNotifPayload {
  confirmacao?:        boolean;
  lembrete?:           boolean;
  cancelamento?:       boolean;
  novosProfissionais?: boolean;
  dicas?:              boolean;
  canalEmail?:         boolean;
  canalWhatsapp?:      boolean;
  canalPush?:          boolean;
}

// ─── Funções de API ───────────────────────────────────────────────────────────

/**
 * Busca dados do perfil do cliente autenticado.
 * GET /api/client-portal/perfil/perfil
 */
export async function getPerfil(): Promise<PerfilCliente> {
  const { data } = await api.get('/client-portal/perfil/perfil');
  return data;
}

/**
 * Atualiza dados pessoais (nome, email, telefone, username, objetivo).
 * PATCH /api/client-portal/perfil/perfil
 */
export async function updatePerfil(campos: UpdatePerfilPayload): Promise<PerfilCliente> {
  const { data } = await api.patch('/client-portal/perfil/perfil', campos);
  return data;
}

/**
 * Faz upload do avatar do cliente.
 * POST /api/client-portal/perfil/perfil/avatar
 * Usa multipart/form-data com field "avatar".
 */
export async function uploadAvatar(file: File): Promise<{ id: string; avatarUrl: string }> {
  const form = new FormData();
  form.append('avatar', file);
  const { data } = await api.post('/client-portal/perfil/perfil/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

/**
 * Exclui conta do cliente (soft delete). Requer senha atual para confirmar.
 * DELETE /api/client-portal/perfil/perfil
 */
export async function excluirConta(senhaAtual: string): Promise<void> {
  await api.delete('/client-portal/perfil/perfil', { data: { senhaAtual } });
}

/**
 * Busca informações do plano atual.
 * GET /api/client-portal/perfil/plano
 */
export async function getPlano(): Promise<PlanoInfo> {
  const { data } = await api.get('/client-portal/perfil/plano');
  return data;
}

/**
 * Busca preferências de notificação (cria defaults se primeira vez).
 * GET /api/client-portal/perfil/notificacoes
 */
export async function getNotifPrefs(): Promise<NotifPrefs> {
  const { data } = await api.get('/client-portal/perfil/notificacoes');
  return data;
}

/**
 * Salva preferências de notificação.
 * PUT /api/client-portal/perfil/notificacoes
 */
export async function updateNotifPrefs(prefs: UpdateNotifPayload): Promise<NotifPrefs> {
  const { data } = await api.put('/client-portal/perfil/notificacoes', prefs);
  return data;
}

/**
 * Altera a senha do cliente.
 * POST /api/client-portal/perfil/seguranca/senha
 */
export async function alterarSenha(
  senhaAtual: string,
  novaSenha:  string,
  confirmar:  string,
): Promise<{ message: string }> {
  const { data } = await api.post('/client-portal/perfil/seguranca/senha', {
    senhaAtual,
    novaSenha,
    confirmar,
  });
  return data;
}
