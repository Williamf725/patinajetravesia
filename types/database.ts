export type Alumno = {
  id: string;
  numero_alumno: number;
  nombre_completo: string;
  email: string | null;
  created_at: string;
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
  fecha_confirmacion: string | null;
  created_at: string;
  // Join fields
  alumno?: Alumno;
  plan?: Plan;
  clases_usadas?: number;
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
