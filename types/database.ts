export type Database = {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string;
          nombre: string;
          zona: string | null;
          posicion_preferida: string | null;
          rating: number;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          nombre: string;
          zona?: string | null;
          posicion_preferida?: string | null;
          rating?: number;
          avatar_url?: string | null;
        };
        Update: {
          nombre?: string;
          zona?: string | null;
          posicion_preferida?: string | null;
          rating?: number;
          avatar_url?: string | null;
        };
      };
      partidos: {
        Row: {
          id: string;
          creador_id: string;
          titulo: string;
          cancha: string | null;
          lat: number | null;
          lng: number | null;
          fecha_hora: string;
          jugadores_necesarios: number;
          jugadores_confirmados: number;
          estado: 'abierto' | 'cerrado' | 'cancelado';
          tipo_cancha: string;
          notas: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          creador_id: string;
          titulo: string;
          cancha?: string | null;
          lat?: number | null;
          lng?: number | null;
          fecha_hora: string;
          jugadores_necesarios: number;
          jugadores_confirmados?: number;
          estado?: 'abierto' | 'cerrado' | 'cancelado';
          tipo_cancha?: string;
          notas?: string | null;
        };
        Update: {
          titulo?: string;
          cancha?: string | null;
          lat?: number | null;
          lng?: number | null;
          fecha_hora?: string;
          jugadores_necesarios?: number;
          jugadores_confirmados?: number;
          estado?: 'abierto' | 'cerrado' | 'cancelado';
          tipo_cancha?: string;
          notas?: string | null;
        };
      };
      inscripciones: {
        Row: {
          id: string;
          partido_id: string;
          usuario_id: string;
          estado: 'pendiente' | 'confirmado' | 'rechazado';
          created_at: string;
        };
        Insert: {
          id?: string;
          partido_id: string;
          usuario_id: string;
          estado?: 'pendiente' | 'confirmado' | 'rechazado';
        };
        Update: {
          estado?: 'pendiente' | 'confirmado' | 'rechazado';
        };
      };
    };
  };
};

// Tipos de conveniencia
export type Usuario = Database['public']['Tables']['usuarios']['Row'];
export type Partido = Database['public']['Tables']['partidos']['Row'];
export type Inscripcion = Database['public']['Tables']['inscripciones']['Row'];

export type PartidoInsert = Database['public']['Tables']['partidos']['Insert'];
export type InscripcionInsert = Database['public']['Tables']['inscripciones']['Insert'];
export type UsuarioInsert = Database['public']['Tables']['usuarios']['Insert'];
