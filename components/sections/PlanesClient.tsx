'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface PlanFromDb {
  nombre: string;
  descripcion: string | null;
  precio: number;
  clases_incluidas: number;
}

interface PlanesClientProps {
  planes: PlanFromDb[];
  loading?: boolean;
  loadError?: boolean;
  onRetry?: () => void;
}

export default function PlanesClient({ planes, loading = false, loadError = false, onRetry }: PlanesClientProps) {
  return (
    <section style={{ background: '#0a0a0a', padding: '80px 24px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Título */}
        <p style={{ color: '#ff2d78', fontSize: '12px', letterSpacing: '4px',
          fontFamily: 'Space Grotesk', margin: '0 0 16px', textAlign: 'center' }}>
          ÚNETE AL PARCHE
        </p>
        <h2 style={{ color: '#fff', fontFamily: 'Anton', fontSize: 'clamp(36px, 6vw, 64px)',
          margin: '0 0 64px', textAlign: 'center', letterSpacing: '-1px' }}>
          PLANES Y TARIFAS
        </h2>

        {/* Grid de planes */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '48px',
        }}>
          {loading && (
            <p role="status" style={{ color: '#aaa', fontFamily: 'Space Grotesk', gridColumn: '1 / -1', textAlign: 'center' }}>
              Cargando planes…
            </p>
          )}
          {loadError && !loading && (
            <div role="alert" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '24px', border: '1px solid #333' }}>
              <p style={{ color: '#fff', fontFamily: 'Space Grotesk', marginBottom: '16px' }}>
                No pudimos cargar los planes. Inténtalo de nuevo.
              </p>
              <button
                type="button"
                onClick={onRetry}
                style={{ background: '#00ff88', color: '#000', border: 0, padding: '12px 24px', fontFamily: 'Anton', letterSpacing: '2px', cursor: 'pointer' }}
              >
                REINTENTAR
              </button>
            </div>
          )}
          {!loading && !loadError && planes.length === 0 && (
            <p style={{ color: '#aaa', fontFamily: 'Space Grotesk', gridColumn: '1 / -1', textAlign: 'center' }}>
              No hay planes disponibles en este momento.
            </p>
          )}
          {planes.map((plan, i) => {
            // Animación tipo resorte escalonada idéntica al estilo de EntrenamientosSection.tsx
            const rotations = [-2, 1, -1, 2];
            const rot = rotations[i % rotations.length];

            return (
              <motion.div
                key={plan.nombre}
                initial={{ opacity: 0, y: 100, rotate: 10 }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                  rotate: i === 2 ? 0 : rot, // El plan destacado (i === 2) queda recto para destacar, o puedes rotar igual
                  transition: {
                    type: "spring",
                    damping: 12,
                    stiffness: 100,
                    delay: i * 0.2
                  }
                }}
                viewport={{ once: true }}
                style={{
                  background: '#111',
                  border: `3px solid ${i === 2 ? '#00ff88' : '#222'}`,
                  boxShadow: i === 2 ? '6px 6px 0 #ff2d78' : 'none',
                  padding: '32px 24px',
                  position: 'relative',
                  cursor: 'pointer',
                }}
              >
                {/* Badge destacado para el plan más popular */}
                {i === 2 && (
                  <span style={{
                    position: 'absolute', top: '-14px', left: '24px',
                    background: '#00ff88', color: '#000',
                    fontFamily: 'Anton', fontSize: '12px',
                    letterSpacing: '2px', padding: '4px 12px',
                    zIndex: 10,
                  }}>
                    MÁS POPULAR
                  </span>
                )}
                {/* Nombre del plan */}
                <p style={{ color: '#ff2d78', fontFamily: 'Space Grotesk',
                  fontSize: '12px', letterSpacing: '3px', margin: '0 0 12px',
                  textTransform: 'uppercase' }}>
                  {plan.descripcion || 'Plan'}
                </p>
                <h3 style={{ color: '#fff', fontFamily: 'Anton', fontSize: '24px',
                  margin: '0 0 24px', letterSpacing: '1px' }}>
                  {plan.nombre.toUpperCase()}
                </h3>
                {/* Precio */}
                <div style={{ marginBottom: '24px' }}>
                  <span style={{ color: '#00ff88', fontFamily: 'Anton',
                    fontSize: '42px', letterSpacing: '-1px' }}>
                    ${plan.precio.toLocaleString('es-CO')}
                  </span>
                  <span style={{ color: '#555', fontFamily: 'Space Grotesk',
                    fontSize: '14px', marginLeft: '8px' }}>
                    COP
                  </span>
                </div>
                {/* Clases incluidas */}
                <p style={{ color: '#aaa', fontFamily: 'Space Grotesk',
                  fontSize: '14px', margin: '0 0 8px' }}>
                  ✓ {plan.clases_incluidas === 1
                    ? '1 clase'
                    : `${plan.clases_incluidas} clases al mes`}
                </p>
                <p style={{ color: '#aaa', fontFamily: 'Space Grotesk',
                  fontSize: '14px', margin: '0 0 8px' }}>
                  ✓ Acceso a todos los horarios
                </p>
                <p style={{ color: '#aaa', fontFamily: 'Space Grotesk',
                  fontSize: '14px', margin: 0 }}>
                  ✓ Seguro contra accidentes incluido
                </p>
                <Link
                  href={`/registro?plan=${encodeURIComponent(plan.nombre)}`}
                  aria-label={`Inscribirme en ${plan.nombre}`}
                  style={{ position: 'absolute', inset: 0, zIndex: 20 }}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Nota de inscripción */}
        <div style={{
          border: '1px solid #333', padding: '20px 24px',
          display: 'flex', alignItems: 'center', gap: '16px',
          flexWrap: 'wrap',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://res.cloudinary.com/dvpnkr2i9/image/upload/v1784131243/seguro-mundial_phqk3p.png"
            style={{ height: '40px', width: 'auto' }} alt="Seguro Mundial"
          />
          <p style={{ color: '#666', fontFamily: 'Space Grotesk',
            fontSize: '14px', margin: 0, flex: 1 }}>
            Se cobra una inscripción única de{' '}
            <strong style={{ color: '#fff' }}>$20.000 COP</strong>{' '}
            que incluye tu póliza de seguro contra accidentes con Seguro Mundial vigente por 1 año.
          </p>
        </div>

        {/* CTA */}
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          gap: '20px', flexWrap: 'wrap', marginTop: '48px',
        }}>
          <Link href="/registro"
            style={{
              display: 'inline-block',
              background: '#00ff88', color: '#000',
              fontFamily: 'Anton', fontSize: '16px',
              letterSpacing: '3px', padding: '16px 40px',
              textDecoration: 'none',
              border: '3px solid #00ff88',
              boxShadow: '4px 4px 0 #ff2d78',
            }}>
            INSCRÍBETE AHORA
          </Link>
          <a href="https://wa.me/573222508676"
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              background: 'transparent', color: '#fff',
              fontFamily: 'Anton', fontSize: '16px',
              letterSpacing: '2px', padding: '16px 32px',
              textDecoration: 'none',
              border: '3px solid #ff2d78',
            }}>
            ESCRÍBENOS POR WHATSAPP
          </a>
        </div>
      </div>
    </section>
  );
}

