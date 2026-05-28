import { api } from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AutorPost {
  id:            string;
  nome:          string;
  avatarUrl:     string | null;
  especialidade: string | null;
  localizacao:   string | null;
}

export interface PostFeed {
  id:          string;
  topico:      string;
  caption:     string;
  imagemUrl:   string;
  aspectRatio: number;
  likes:       number;
  comentarios: number;
  liked:       boolean;
  criadoEm:   string;
  autor:       AutorPost;
}

export interface ComentarioFeed {
  id:       string;
  texto:    string;
  criadoEm: string;
  autor: {
    id:        string;
    nome:      string;
    avatarUrl: string | null;
    tipo:      'profissional' | 'cliente';
  };
}

export interface FeedListResult {
  data: PostFeed[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface ComentariosResult {
  data: ComentarioFeed[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export type CategoriaFeed = 'Todos' | 'Profissionais' | 'Serviços' | 'Próximos a mim';

export interface FeedParams {
  page?:      number;
  limit?:     number;
  search?:    string;
  categoria?: CategoriaFeed;
}

// ─── Funções de API ───────────────────────────────────────────────────────────

/** Lista posts paginados com busca e filtro de categoria */
export async function listarFeed(params?: FeedParams): Promise<FeedListResult> {
  const { data } = await api.get('/client-portal/feed', { params });
  return data;
}

/** Lista comentários paginados de um post */
export async function listarComentarios(
  postId: string,
  page = 1,
  limit = 20,
): Promise<ComentariosResult> {
  const { data } = await api.get(`/client-portal/feed/${postId}/comentarios`, {
    params: { page, limit },
  });
  return data;
}

/** Toggle curtida — retorna novo estado e contagem */
export async function curtirPost(postId: string): Promise<{ liked: boolean; likes: number }> {
  const { data } = await api.post(`/client-portal/feed/${postId}/curtir`);
  return data;
}

/** Cria comentário em um post */
export async function comentarPost(postId: string, texto: string): Promise<ComentarioFeed> {
  const { data } = await api.post(`/client-portal/feed/${postId}/comentar`, { texto });
  return data;
}

/** Denuncia um post */
export async function denunciarPost(
  postId: string,
  motivo: 'spam' | 'conteudo_improprio' | 'desinformacao' | 'assedio' | 'outro',
  descricao?: string,
): Promise<{ message: string }> {
  const { data } = await api.post(`/client-portal/feed/${postId}/denunciar`, { motivo, descricao });
  return data;
}
