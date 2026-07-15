export type Alumno = {
  id: string;
  numero_alumno: number;
  nombre: string | null;
  apellido: string | null;
  nombre_completo: string;
  email: string | null;
  tipo_documento: string | null;
  numero_documento: string | null;
  telefono: string | null;
  fecha_nacimiento: string | null;
  perfil_completo: boolean;
  activo: boolean;
  created_at: string;
  inscripcion_pagada?: boolean;
  fecha_pago_inscripcion?: string | null;
  fecha_vencimiento_seguro?: string | null;
  observaciones?: string | null;
};

export type Plan = {
  id: string;
  nombre: string;
  precio: number;
  clases_incluidas: number;
  created_at: string;
};

export type Inscripcion = {
  id: string;
  alumno_id: string;
  plan_id: string;
  mes: string;
  anio: number;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  clases_usadas: number;
  total_pagado: number;
  observaciones: string | null;
  comprobante_url: string | null;
  comprobante_verificado: boolean;
  fecha_vencimiento: string | null;
  fecha_aprobacion: string | null;
  created_at: string;
  updated_at?: string;
  // Join fields
  alumno?: Alumno;
  plan?: Plan;
};

export type Asistencia = {
  id: string;
  alumno_id: string;
  fecha: string;
  presente: boolean;
  created_at: string;
};

export type Pago = {
  id: string;
  alumno_id: string;
  mes: string;
  anio: number;
  clases_tomadas: number;
  valor_por_clase: number;
  pago_mensual: number;
  pagado: boolean;
  abonos: Abono[];
  observaciones: string;
  created_at: string;
  updated_at: string;
};

export type Abono = {
  monto: number;
  fecha: string;
};

export type Galeria = {
  id: string;
  url: string;
  public_id: string;
  tipo: 'foto' | 'video';
  titulo: string;
  created_at: string;
};
