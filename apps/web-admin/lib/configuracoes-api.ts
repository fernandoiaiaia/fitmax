import { api } from './api';

// ─── Types (espelham o retorno da API) ────────────────────────────────────────

export interface AdminPerfil {
  id:        string;
  email:     string;
  name:      string | null;
  phone:     string | null;
  username:  string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface NotifPrefs {
  novaConsulta:       boolean;
  cancelamento:       boolean;
  novoUsuario:        boolean;
  assinaturaVencendo: boolean;
  relatorioSemanal:   boolean;
  canalEmail:         boolean;
  canalWhatsapp:      boolean;
  canalPush:          boolean;
  updatedAt:          string;
}

export interface ConvenioItem {
  id:          string;
  nome:        string;
  categoria:   string;
  ativo:       boolean;
  criadoPorId: string;
  createdAt:   string;
  updatedAt:   string;
}

export interface ConveniosResponse {
  convenios: ConvenioItem[];
  stats: { total: number; ativos: number; inativos: number };
}

export interface UpdatePerfilPayload {
  name?:     string;
  phone?:    string;
  username?: string;
}

export interface AlterarSenhaPayload {
  senhaAtual: string;
  novaSenha:  string;
  confirmar:  string;
}

export interface ConvenioPayload {
  nome:      string;
  categoria: string;
}

// ─── Perfil ───────────────────────────────────────────────────────────────────

/** GET /admin/configuracoes/perfil */
export async function fetchPerfil(): Promise<AdminPerfil> {
  const { data } = await api.get<AdminPerfil>('/admin/configuracoes/perfil');
  return data;
}

/** PATCH /admin/configuracoes/perfil */
export async function updatePerfil(payload: UpdatePerfilPayload): Promise<AdminPerfil> {
  const { data } = await api.patch<AdminPerfil>('/admin/configuracoes/perfil', payload);
  return data;
}

/** POST /admin/configuracoes/perfil/avatar — multipart/form-data */
export async function uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
  const form = new FormData();
  form.append('avatar', file);
  const { data } = await api.post<{ avatarUrl: string }>(
    '/admin/configuracoes/perfil/avatar',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data;
}

// ─── Notificações ─────────────────────────────────────────────────────────────

/** GET /admin/configuracoes/notificacoes */
export async function fetchNotifPrefs(): Promise<NotifPrefs> {
  const { data } = await api.get<NotifPrefs>('/admin/configuracoes/notificacoes');
  return data;
}

/** PUT /admin/configuracoes/notificacoes */
export async function updateNotifPrefs(
  prefs: Partial<Omit<NotifPrefs, 'updatedAt'>>,
): Promise<NotifPrefs> {
  const { data } = await api.put<NotifPrefs>('/admin/configuracoes/notificacoes', prefs);
  return data;
}

// ─── Segurança ────────────────────────────────────────────────────────────────

/** POST /admin/configuracoes/seguranca/senha */
export async function alterarSenha(
  payload: AlterarSenhaPayload,
): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>(
    '/admin/configuracoes/seguranca/senha',
    payload,
  );
  return data;
}

// ─── Convênios ────────────────────────────────────────────────────────────────

/** GET /admin/configuracoes/convenios */
export async function fetchConvenios(): Promise<ConveniosResponse> {
  const { data } = await api.get<ConveniosResponse>('/admin/configuracoes/convenios');
  return data;
}

/** POST /admin/configuracoes/convenios */
export async function criarConvenio(payload: ConvenioPayload): Promise<ConvenioItem> {
  const { data } = await api.post<ConvenioItem>('/admin/configuracoes/convenios', payload);
  return data;
}

/** PUT /admin/configuracoes/convenios/:id */
export async function editarConvenio(
  id: string,
  payload: Partial<ConvenioPayload>,
): Promise<ConvenioItem> {
  const { data } = await api.put<ConvenioItem>(
    `/admin/configuracoes/convenios/${id}`,
    payload,
  );
  return data;
}

/** PATCH /admin/configuracoes/convenios/:id/toggle */
export async function toggleConvenio(id: string): Promise<ConvenioItem> {
  const { data } = await api.patch<ConvenioItem>(
    `/admin/configuracoes/convenios/${id}/toggle`,
  );
  return data;
}

/** DELETE /admin/configuracoes/convenios/:id */
export async function excluirConvenio(
  id: string,
): Promise<{ deleted: boolean; id: string; nome: string }> {
  const { data } = await api.delete(`/admin/configuracoes/convenios/${id}`);
  return data;
}

// ─── Administradores ──────────────────────────────────────────────────────────

export interface AdminItem {
  id:        string;
  email:     string;
  name:      string | null;
  phone:     string | null;
  username:  string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface CriarAdminPayload {
  email:     string;
  name?:     string;
  password:  string;
}

/** GET /admin/configuracoes/admins */
export async function fetchAdmins(): Promise<AdminItem[]> {
  const { data } = await api.get<AdminItem[]>('/admin/configuracoes/admins');
  return data;
}

/** POST /admin/configuracoes/admins */
export async function criarAdmin(payload: CriarAdminPayload): Promise<AdminItem> {
  const { data } = await api.post<AdminItem>('/admin/configuracoes/admins', payload);
  return data;
}

/** DELETE /admin/configuracoes/admins/:id */
export async function excluirAdmin(
  id: string,
): Promise<{ deleted: boolean; id: string; email: string }> {
  const { data } = await api.delete(`/admin/configuracoes/admins/${id}`);
  return data;
}

