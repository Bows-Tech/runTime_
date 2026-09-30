/**
 * Tipos de la base de datos.
 *
 * Estos tipos reflejan supabase/schema.sql. Si tu base ya existe con otra
 * forma, regenera los tipos con:
 *   npx supabase gen types typescript --project-id <tu-project-id>
 * y reemplaza este archivo. No los edites a mano.
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type ScriptStatus = 'borrador' | 'publicado' | 'archivado';
export type OrderStatus = 'pendiente' | 'pagado' | 'fallido' | 'reembolsado';
export type PublicationStatus = 'borrador' | 'publicado' | 'archivado';
export type PaymentMethod = 'paypal' | 'transferencia';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          is_admin: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          is_admin?: boolean;
          created_at?: string;
        };
        Update: {
          full_name?: string | null;
          is_admin?: boolean;
        };
        Relationships: [];
      };
      scripts: {
        Row: {
          id: string;
          slug: string;
          name: string;
          extension: string;
          category: string;
          price_cents: number;
          description: Json;
          long_description: Json;
          status: ScriptStatus;
          file_path: string | null;
          file_size: number | null;
          download_count: number;
          sales_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          slug: string;
          name: string;
          extension?: string;
          category?: string;
          price_cents: number;
          description?: Json;
          long_description?: Json;
          status?: ScriptStatus;
          file_path?: string | null;
          file_size?: number | null;
        };
        Update: {
          slug?: string;
          name?: string;
          extension?: string;
          category?: string;
          price_cents?: number;
          description?: Json;
          long_description?: Json;
          status?: ScriptStatus;
          file_path?: string | null;
          file_size?: number | null;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          email: string;
          amount_cents: number;
          currency: string;
          status: OrderStatus;
          payment_method: PaymentMethod | null;
          paypal_order_id: string | null;
          created_at: string;
          paid_at: string | null;
        };
        Insert: {
          email: string;
          amount_cents: number;
          currency?: string;
          status?: OrderStatus;
          payment_method?: PaymentMethod | null;
          paypal_order_id?: string | null;
        };
        Update: {
          status?: OrderStatus;
          paid_at?: string | null;
          payment_method?: PaymentMethod | null;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          script_id: string | null;
          script_name: string;
          unit_cents: number;
          quantity: number;
        };
        Insert: {
          order_id: string;
          script_id?: string | null;
          script_name: string;
          unit_cents: number;
          quantity?: number;
        };
        Update: never;
        Relationships: [];
      };
      download_tokens: {
        Row: {
          token: string;
          order_id: string;
          script_id: string;
          email: string;
          used: boolean;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          order_id: string;
          script_id: string;
          email: string;
          expires_at?: string;
        };
        Update: { used?: boolean };
        Relationships: [];
      };
      publications: {
        Row: {
          id: string;
          slug: string;
          title: Json;
          body: Json;
          status: PublicationStatus;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          slug: string;
          title?: Json;
          body?: Json;
          status?: PublicationStatus;
          published_at?: string | null;
        };
        Update: {
          slug?: string;
          title?: Json;
          body?: Json;
          status?: PublicationStatus;
          published_at?: string | null;
        };
        Relationships: [];
      };
      transfer_receipts: {
        Row: {
          id: string;
          order_id: string;
          file_path: string;
          file_size: number;
          note: string | null;
          reviewed: boolean;
          created_at: string;
        };
        Insert: {
          order_id: string;
          file_path: string;
          file_size?: number;
          note?: string | null;
        };
        Update: { reviewed?: boolean };
        Relationships: [];
      };
      subscribers: {
        Row: { id: string; email: string; created_at: string };
        Insert: { email: string };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

/** Contenido traducido guardado como jsonb { "es": "...", "en": "..." }. */
export function pickTranslation(value: Json | null | undefined, locale: string, fallback = ''): string {
  if (!value) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value !== 'object' || Array.isArray(value)) return fallback;

  const record = value as Record<string, Json>;
  return (
    (typeof record[locale] === 'string' && (record[locale] as string)) ||
    (typeof record.es === 'string' && (record.es as string)) ||
    (typeof record.en === 'string' && (record.en as string)) ||
    fallback
  );
}
