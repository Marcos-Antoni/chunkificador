// ============================================
// Tipos del API - Cerebro Brain
// ============================================

/** Idea similar encontrada por búsqueda semántica */
export interface SimilarIdea {
  id: number;
  content: string;
  similarity: number;
}

/** Átomo generado por el motor de atomización */
export interface Atom {
  id: string;
  text?: string;
  statement?: string;
  type: string;
  related_ids: string[];
  similarIdeas?: SimilarIdea[];
  searchingSimilar?: boolean;
}

/** Materia/Subject del sistema */
export interface Subject {
  id: number;
  name: string;
}

/** Conexión entre ideas (saliente) */
export interface OutgoingConnection {
  connection_id: number;
  to_idea_id: number;
  to_content: string;
  connection_type: string;
  weight: number;
}

/** Conexión entre ideas (entrante) */
export interface IncomingConnection {
  connection_id: number;
  from_idea_id: number;
  from_content: string;
  connection_type: string;
  weight: number;
}

/** Datos completos de una idea (detalle) */
export interface IdeaData {
  id: number;
  content: string;
  type: string;
  created_at: string;
  subjects: Subject[];
  outgoing_connections: OutgoingConnection[];
  incoming_connections: IncomingConnection[];
}

/** Resultado de búsqueda avanzada */
export interface SearchResult {
  id: number;
  content: string;
  type?: string;
  similarity?: number;
  subjects?: string[];
  batch_id?: string;
}

/** Paginación de resultados */
export interface Pagination {
  total_pages: number;
  total_results: number;
}

/** Propuesta de conexión generada por IA */
export interface ConnectionProposal {
  from_idea_id: number;
  to_idea_id: number;
  connection_type: string;
  weight: number;
  explanation: string;
}
