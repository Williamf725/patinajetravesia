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
  comprobante_inscripcion_url?: string | null;
  comprobante_inscripcion_pendiente?: boolean;
  tipo_pago_inscripcion?: 'solo_inscripcion' | 'inscripcion_y_plan' | null;
  plan_inscripcion_id?: string | null;
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
  renovacion_pendiente?: boolean;
  notificacion_pocas_clases_enviada?: boolean;
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

export type Categoria = {
  id: string;
  nombre: string;
  slug: string;
  created_at: string;
};

export type ProductoFoto = {
  id: string;
  producto_id: string;
  url: string;
  alt: string | null;
  orden: number;
  es_principal: boolean;
  created_at: string;
};

export type ProductoTalla = {
  id: string;
  producto_id: string;
  talla: string;
  stock: number;
  disponible: boolean;
  created_at: string;
};

export type ProductoColor = {
  id: string;
  producto_id: string;
  nombre: string;
  hex: string;
  disponible: boolean;
  created_at: string;
};

export type Producto = {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  descripcion_corta?: string | null;
  precio: number;
  precio_descuento: number | null;
  disponible: boolean;
  nuevo: boolean;
  destacado?: boolean;
  agotado: boolean;
  genero?: string;
  orden: number;
  categoria_id: string | null;
  permite_personalizacion?: boolean;
  created_at: string;
  // Joins
  categoria?: Categoria | null;
  fotos?: ProductoFoto[];
  tallas?: ProductoTalla[];
  colores?: ProductoColor[];
};

export type CarritoItem = {
  id: string;
  user_id: string;
  producto_id: string;
  talla: string;
  color: string;
  cantidad: number;
  personalizado?: boolean;
  nombre_personalizacion?: string | null;
  precio_extra?: number;
  created_at: string;
  // Joins
  producto?: Producto;
};

export type Pedido = {
  id: string;
  user_id: string | null;
  nombre_alumno: string | null;
  ciudad: string;
  direccion: string;
  total: number;
  estado: string;
  created_at: string;
  // Joins
  items?: PedidoItem[];
};

export type PedidoItem = {
  id: string;
  pedido_id: string;
  producto_id: string;
  talla: string;
  color: string;
  cantidad: number;
  precio: number;
  created_at: string;
  // Joins
  producto?: Producto;
};
