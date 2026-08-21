export type EstadoPlan =
  | 'activo'
  | 'pocas_clases'    // le queda 1 sola clase
  | 'agotado'         // usó todas las clases o más
  | 'renovacion_pendiente'  // ya subió comprobante nuevo
  | 'sin_plan'

export function calcularEstadoPlan(inscripcion?: {
  clases_usadas: number
  plan?: { clases_incluidas: number } | null
  renovacion_pendiente?: boolean
  comprobante_url?: string | null
} | null): EstadoPlan {
  if (!inscripcion || !inscripcion.plan) return 'sin_plan'

  const { clases_usadas, plan, renovacion_pendiente } = inscripcion
  const restantes = plan.clases_incluidas - clases_usadas

  if (renovacion_pendiente) return 'renovacion_pendiente'
  if (restantes <= 0) return 'agotado'
  if (restantes === 1) return 'pocas_clases'
  return 'activo'
}
