/**
 * Tipos TypeScript para as tabelas do banco de dados
 * Estes tipos são gerados baseados no schema rpg do Supabase
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // Views que apontam para o schema rpg (com prefixo rpg_ para evitar conflitos)
      rpg_games: {
        Row: {
          id: string
          name: string
          master: string
          status: 'open' | 'running' | 'finished'
          invite_code: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          master: string
          status?: 'open' | 'running' | 'finished'
          invite_code?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          master?: string
          status?: 'open' | 'running' | 'finished'
          invite_code?: string | null
          created_at?: string
        }
      }
      rpg_players: {
        Row: {
          id: string
          game_id: string
          user_id: string
          role: 'player' | 'master' | 'gm'
          character_id: string | null
          position_x: number | null
          position_y: number | null
          color: string
          joined_at: string
        }
        Insert: {
          id?: string
          game_id: string
          user_id: string
          role?: 'player' | 'master' | 'gm'
          character_id?: string | null
          position_x?: number | null
          position_y?: number | null
          color?: string
          joined_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          user_id?: string
          role?: 'player' | 'master' | 'gm'
          character_id?: string | null
          position_x?: number | null
          position_y?: number | null
          color?: string
          joined_at?: string
        }
      }
      rpg_chat: {
        Row: {
          id: string
          game_id: string | null
          user_id: string | null
          message: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          game_id?: string | null
          user_id?: string | null
          message?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string | null
          user_id?: string | null
          message?: string | null
          metadata?: Json
          created_at?: string
        }
      }
      rpg_maps: {
        Row: {
          id: string
          game_id: string | null
          filename: string | null
          width: number | null
          height: number | null
          metadata: Json
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          game_id?: string | null
          filename?: string | null
          width?: number | null
          height?: number | null
          metadata?: Json
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string | null
          filename?: string | null
          width?: number | null
          height?: number | null
          metadata?: Json
          uploaded_by?: string | null
          created_at?: string
        }
      }
      rpg_actions: {
        Row: {
          id: string
          game_id: string
          character_id: string | null
          actor: string | null
          action: Json
          resolved: boolean
          created_at: string
        }
        Insert: {
          id?: string
          game_id: string
          character_id?: string | null
          actor?: string | null
          action?: Json
          resolved?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          character_id?: string | null
          actor?: string | null
          action?: Json
          resolved?: boolean
          created_at?: string
        }
      }
      rpg_characters: {
        Row: {
          id: string
          game_id: string | null
          owner: string
          name: string
          class: string | null
          level: number
          hp: number
          mp: number
          stats: Json
          sheet: Json
          status: 'active' | 'inactive' | 'dead'
          created_at: string
        }
        Insert: {
          id?: string
          game_id?: string | null
          owner: string
          name: string
          class?: string | null
          level?: number
          hp?: number
          mp?: number
          stats?: Json
          sheet?: Json
          status?: 'active' | 'inactive' | 'dead'
          xp_percentage?: number
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string | null
          owner?: string
          name?: string
          class?: string | null
          level?: number
          hp?: number
          mp?: number
          stats?: Json
          sheet?: Json
          status?: 'active' | 'inactive' | 'dead'
          xp_percentage?: number
          created_at?: string
        }
      }
      rpg_combat_actions: {
        Row: {
          id: string
          game_id: string
          name: string
          dice_type: 4 | 6 | 8 | 12 | 20
          dice_amount: number
          modifier: number
          damage_type: string
          target_type: 'single' | 'multiple'
          description: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          game_id: string
          name: string
          dice_type: 4 | 6 | 8 | 12 | 20
          dice_amount?: number
          modifier?: number
          damage_type?: string
          target_type?: 'single' | 'multiple'
          description?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          name?: string
          dice_type?: 4 | 6 | 8 | 12 | 20
          dice_amount?: number
          modifier?: number
          damage_type?: string
          target_type?: 'single' | 'multiple'
          description?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      rpg_combat_logs: {
        Row: {
          id: string
          encounter_id: string
          actor_id: string
          actor_type: 'player' | 'npc'
          actor_name: string
          action_name: string
          action_id: string | null
          dice_type: 4 | 6 | 8 | 12 | 20
          dice_amount: number
          dice_modifier: number
          roll_values: number[]
          roll_total: number
          final_damage: number
          is_critical: boolean
          is_fumble: boolean
          targets_hit: Json
          damage_dealt: Json
          created_at: string
        }
        Insert: {
          id?: string
          encounter_id: string
          actor_id: string
          actor_type: 'player' | 'npc'
          actor_name: string
          action_name: string
          action_id?: string | null
          dice_type: 4 | 6 | 8 | 12 | 20
          dice_amount: number
          dice_modifier?: number
          roll_values: number[]
          roll_total: number
          final_damage: number
          is_critical?: boolean
          is_fumble?: boolean
          targets_hit: Json
          damage_dealt: Json
          created_at?: string
        }
        Update: {
          id?: string
          encounter_id?: string
          actor_id?: string
          actor_type?: 'player' | 'npc'
          actor_name?: string
          action_name?: string
          action_id?: string | null
          dice_type?: 4 | 6 | 8 | 12 | 20
          dice_amount?: number
          dice_modifier?: number
          roll_values?: number[]
          roll_total?: number
          final_damage?: number
          is_critical?: boolean
          is_fumble?: boolean
          targets_hit?: Json
          damage_dealt?: Json
          created_at?: string
        }
      }
      rpg_npcs: {
        Row: {
          id: string
          game_id: string
          name: string
          type: string
          class: string | null
          level: number
          hp: number
          max_hp: number
          mp: number
          max_mp: number
          stats: Json
          sheet: Json
          position_x: number | null
          position_y: number | null
          status: string
          color: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          game_id: string
          name: string
          type?: string
          class?: string | null
          level?: number
          hp?: number
          max_hp?: number
          mp?: number
          max_mp?: number
          stats?: Json
          sheet?: Json
          position_x?: number | null
          position_y?: number | null
          status?: string
          color?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          name?: string
          type?: string
          class?: string | null
          level?: number
          hp?: number
          max_hp?: number
          mp?: number
          max_mp?: number
          stats?: Json
          sheet?: Json
          position_x?: number | null
          position_y?: number | null
          status?: string
          color?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      rpg_encounters: {
        Row: {
          id: string
          game_id: string
          name: string | null
          status: 'setup' | 'active' | 'finished'
          current_turn: number
          current_round: number
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          game_id: string
          name?: string | null
          status?: 'setup' | 'active' | 'finished'
          current_turn?: number
          current_round?: number
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          name?: string | null
          status?: 'setup' | 'active' | 'finished'
          current_turn?: number
          current_round?: number
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      rpg_initiative_entries: {
        Row: {
          id: string
          encounter_id: string
          participant_type: 'player' | 'npc'
          participant_id: string
          initiative_value: number | null
          turn_order: number | null
          has_acted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          encounter_id: string
          participant_type: 'player' | 'npc'
          participant_id: string
          initiative_value?: number | null
          turn_order?: number | null
          has_acted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          encounter_id?: string
          participant_type?: 'player' | 'npc'
          participant_id?: string
          initiative_value?: number | null
          turn_order?: number | null
          has_acted?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
  rpg: {
    Tables: {
      games: {
        Row: {
          id: string
          name: string
          master: string
          status: 'open' | 'running' | 'finished'
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          master: string
          status?: 'open' | 'running' | 'finished'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          master?: string
          status?: 'open' | 'running' | 'finished'
          created_at?: string
        }
      }
      players: {
        Row: {
          id: string
          game_id: string
          user_id: string
          role: 'player' | 'master' | 'gm'
          character_id: string | null
          position_x: number | null
          position_y: number | null
          joined_at: string
        }
        Insert: {
          id?: string
          game_id: string
          user_id: string
          role?: 'player' | 'master' | 'gm'
          character_id?: string | null
          position_x?: number | null
          position_y?: number | null
          color?: string
          joined_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          user_id?: string
          role?: 'player' | 'master' | 'gm'
          character_id?: string | null
          position_x?: number | null
          position_y?: number | null
          color?: string
          joined_at?: string
        }
      }
      characters: {
        Row: {
          id: string
          game_id: string | null
          owner: string
          name: string
          class: string | null
          level: number
          hp: number
          max_hp: number
          mp: number
          stats: Json
          sheet: Json
          status: 'active' | 'inactive' | 'dead'
          created_at: string
        }
        Insert: {
          id?: string
          game_id?: string | null
          owner: string
          name: string
          class?: string | null
          level?: number
          hp?: number
          max_hp?: number
          mp?: number
          stats?: Json
          sheet?: Json
          status?: 'active' | 'inactive' | 'dead'
          xp_percentage?: number
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string | null
          owner?: string
          name?: string
          class?: string | null
          level?: number
          hp?: number
          max_hp?: number
          mp?: number
          stats?: Json
          sheet?: Json
          status?: 'active' | 'inactive' | 'dead'
          xp_percentage?: number
          created_at?: string
        }
      }
      maps: {
        Row: {
          id: string
          game_id: string | null
          filename: string | null
          width: number | null
          height: number | null
          metadata: Json
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          game_id?: string | null
          filename?: string | null
          width?: number | null
          height?: number | null
          metadata?: Json
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string | null
          filename?: string | null
          width?: number | null
          height?: number | null
          metadata?: Json
          uploaded_by?: string | null
          created_at?: string
        }
      }
      actions: {
        Row: {
          id: string
          game_id: string
          character_id: string | null
          actor: string | null
          action: Json
          resolved: boolean
          created_at: string
        }
        Insert: {
          id?: string
          game_id: string
          character_id?: string | null
          actor?: string | null
          action?: Json
          resolved?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          character_id?: string | null
          actor?: string | null
          action?: Json
          resolved?: boolean
          created_at?: string
        }
      }
      chat: {
        Row: {
          id: string
          game_id: string | null
          user_id: string | null
          message: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          game_id?: string | null
          user_id?: string | null
          message?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string | null
          user_id?: string | null
          message?: string | null
          metadata?: Json
          created_at?: string
        }
      }
    }
  }
}

// Tipos auxiliares para facilitar o uso
// Usando as views do schema public que apontam para rpg (com prefixo rpg_ para evitar conflitos)
export type Character = Database['public']['Tables']['rpg_characters']['Row'] & { max_hp?: number; xp_percentage?: number }
export type CharacterInsert = Database['public']['Tables']['rpg_characters']['Insert'] & { max_hp?: number; xp_percentage?: number }
export type CharacterUpdate = Database['public']['Tables']['rpg_characters']['Update'] & { max_hp?: number; xp_percentage?: number }

// Tipo auxiliar para criação de personagem sem owner (owner é adicionado automaticamente pelo serviço)
export type CharacterInsertWithoutOwner = Omit<CharacterInsert, 'owner'>

export type Game = Database['public']['Tables']['rpg_games']['Row']
export type GameInsert = Database['public']['Tables']['rpg_games']['Insert']
export type GameUpdate = Database['public']['Tables']['rpg_games']['Update']

export type Player = Database['public']['Tables']['rpg_players']['Row']
export type PlayerInsert = Database['public']['Tables']['rpg_players']['Insert']
export type PlayerUpdate = Database['public']['Tables']['rpg_players']['Update']

export type Chat = Database['public']['Tables']['rpg_chat']['Row']
export type ChatInsert = Database['public']['Tables']['rpg_chat']['Insert']
export type ChatUpdate = Database['public']['Tables']['rpg_chat']['Update']

export type Map = Database['public']['Tables']['rpg_maps']['Row']
export type MapInsert = Database['public']['Tables']['rpg_maps']['Insert']
export type MapUpdate = Database['public']['Tables']['rpg_maps']['Update']

export type Action = Database['public']['Tables']['rpg_actions']['Row']
export type ActionInsert = Database['public']['Tables']['rpg_actions']['Insert']
export type ActionUpdate = Database['public']['Tables']['rpg_actions']['Update']

// Tipos para as outras tabelas do schema rpg (quando necessário)
export type Game = Database['rpg']['Tables']['games']['Row']
export type GameInsert = Database['rpg']['Tables']['games']['Insert']
export type GameUpdate = Database['rpg']['Tables']['games']['Update']

export type Player = Database['rpg']['Tables']['players']['Row']
export type PlayerInsert = Database['rpg']['Tables']['players']['Insert']
export type PlayerUpdate = Database['rpg']['Tables']['players']['Update']

export type Map = Database['rpg']['Tables']['maps']['Row']
export type MapInsert = Database['rpg']['Tables']['maps']['Insert']
export type MapUpdate = Database['rpg']['Tables']['maps']['Update']

export type Action = Database['rpg']['Tables']['actions']['Row']
export type ActionInsert = Database['rpg']['Tables']['actions']['Insert']
export type ActionUpdate = Database['rpg']['Tables']['actions']['Update']

export type Chat = Database['rpg']['Tables']['chat']['Row']
export type ChatInsert = Database['rpg']['Tables']['chat']['Insert']
export type ChatUpdate = Database['rpg']['Tables']['chat']['Update']

// Tipos auxiliares para stats (atributos do personagem)
export interface CharacterStats {
  strength?: number
  dexterity?: number
  constitution?: number
  intelligence?: number
  wisdom?: number
  charisma?: number
  race?: string
  [key: string]: Json | undefined
}

export type NPC = Database['public']['Tables']['rpg_npcs']['Row']
export type NPCInsert = Database['public']['Tables']['rpg_npcs']['Insert']
export type NPCUpdate = Database['public']['Tables']['rpg_npcs']['Update']

export type Encounter = Database['public']['Tables']['rpg_encounters']['Row']
export type EncounterInsert = Database['public']['Tables']['rpg_encounters']['Insert']
export type EncounterUpdate = Database['public']['Tables']['rpg_encounters']['Update']

export type InitiativeEntry = Database['public']['Tables']['rpg_initiative_entries']['Row']
export type InitiativeEntryInsert = Database['public']['Tables']['rpg_initiative_entries']['Insert']
export type InitiativeEntryUpdate = Database['public']['Tables']['rpg_initiative_entries']['Update']

// Tipos para sistema de combate
export interface CombatAction {
  id: string
  game_id: string
  name: string
  dice_type: 4 | 6 | 8 | 12 | 20
  dice_amount: number
  modifier: number
  damage_type: string
  target_type: 'single' | 'multiple'
  description: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface CombatActionInsert {
  id?: string
  game_id: string
  name: string
  dice_type: 4 | 6 | 8 | 12 | 20
  dice_amount?: number
  modifier?: number
  damage_type?: string
  target_type?: 'single' | 'multiple'
  description?: string | null
  created_by: string
  created_at?: string
  updated_at?: string
}

export interface CombatActionUpdate {
  id?: string
  game_id?: string
  name?: string
  dice_type?: 4 | 6 | 8 | 12 | 20
  dice_amount?: number
  modifier?: number
  damage_type?: string
  target_type?: 'single' | 'multiple'
  description?: string | null
  created_by?: string
  created_at?: string
  updated_at?: string
}

export interface CombatLogEntry {
  id: string
  encounter_id: string
  actor_id: string
  actor_type: 'player' | 'npc'
  actor_name: string
  action_name: string
  action_id: string | null
  dice_type: 4 | 6 | 8 | 12 | 20
  dice_amount: number
  dice_modifier: number
  roll_values: number[]
  roll_total: number
  final_damage: number
  is_critical: boolean
  is_fumble: boolean
  targets_hit: Array<{ id: string; type: 'player' | 'npc'; name: string }>
  damage_dealt: Array<{ target_id: string; damage: number }>
  created_at: string
}

export interface CombatLogEntryInsert {
  id?: string
  encounter_id: string
  actor_id: string
  actor_type: 'player' | 'npc'
  actor_name: string
  action_name: string
  action_id?: string | null
  dice_type: 4 | 6 | 8 | 12 | 20
  dice_amount: number
  dice_modifier?: number
  roll_values: number[]
  roll_total: number
  final_damage: number
  is_critical?: boolean
  is_fumble?: boolean
  targets_hit: Array<{ id: string; type: 'player' | 'npc'; name: string }>
  damage_dealt: Array<{ target_id: string; damage: number }>
  created_at?: string
}
