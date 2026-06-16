export type Alumno = {
  id: string;
  numero_alumno: number;
  nombre_completo: string;
  created_at: string;
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
