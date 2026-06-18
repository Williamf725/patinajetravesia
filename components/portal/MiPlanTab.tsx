'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plan, Inscripcion } from '@/types/database';
import { selectPlan } from '@/app/auth/actions/portal';
import { CheckCircle2, Clock, XCircle, Info } from 'lucide-react';

interface Props {
  alumnoId: string;
  planes: Plan[];
  inscripcionActual: Inscripcion | null;
}

export default function MiPlanTab({ alumnoId, planes, inscripcionActual }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectPlan = async (planId: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await selectPlan(alumnoId, planId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al seleccionar plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'aprobado': return <CheckCircle2 className="text-neon-green" size={48} />;
      case 'pendiente': return <Clock className="text-yellow-400" size={48} />;
      case 'rechazado': return <XCircle className="text-hot-pink" size={48} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-12">
      {/* Current Subscription Status */}
      <section>
        <h2 className="font-anton text-3xl uppercase mb-6 flex items-center gap-2">
          <Info className="text-neon-green" /> ESTADO DE MI PLAN
        </h2>

        {inscripcionActual ? (
          <div className="bg-[#1a1a1a] border-4 border-white p-8 shadow-brutal flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0">
              {getStatusIcon(inscripcionActual.estado)}
            </div>
            <div className="flex-grow text-center md:text-left">
              <h3 className="font-anton text-4xl uppercase mb-1">
                {inscripcionActual.plan?.nombre}
              </h3>
              <p className="font-mono text-xs text-white/60 uppercase tracking-widest mb-4">
                Periodo: {inscripcionActual.mes} {inscripcionActual.anio}
              </p>

              {inscripcionActual.estado === 'pendiente' && (
                <div className="p-4 bg-yellow-400/10 border-l-4 border-yellow-400 text-yellow-400 font-mono text-sm uppercase">
                  Esperando confirmación de pago por el administrador
                </div>
              )}

              {inscripcionActual.estado === 'aprobado' && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                  <div className="bg-black/40 p-3 border border-white/10">
                    <p className="text-[9px] text-white/40 uppercase">Clases Plan</p>
                    <p className="font-anton text-2xl">{inscripcionActual.plan?.clases_incluidas}</p>
                  </div>
                  <div className="bg-black/40 p-3 border border-white/10">
                    <p className="text-[9px] text-white/40 uppercase">Clases Usadas</p>
                    <p className="font-anton text-2xl text-yellow-400">{inscripcionActual.clases_usadas}</p>
                  </div>
                  <div className="bg-black/40 p-3 border border-white/10">
                    <p className="text-[9px] text-white/40 uppercase">Restantes</p>
                    <p className="font-anton text-2xl text-neon-green">
                      {Math.max(0, (inscripcionActual.plan?.clases_incluidas || 0) - (inscripcionActual.clases_usadas || 0))}
                    </p>
                  </div>
                  <div className="bg-black/40 p-3 border border-white/10">
                    <p className="text-[9px] text-white/40 uppercase">Total Pagado</p>
                    <p className="font-anton text-2xl text-neon-green">
                      ${inscripcionActual.plan?.precio.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {inscripcionActual.estado === 'rechazado' && (
                <div className="p-4 bg-hot-pink/10 border-l-4 border-hot-pink text-hot-pink font-mono text-sm uppercase">
                  Pago rechazado. Contacta al admin por WhatsApp.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-[#1a1a1a] border-4 border-dashed border-white/20 p-8 text-center">
            <p className="font-mono text-sm text-white/40 uppercase tracking-widest">
              No tienes un plan activo para este mes. Selecciona uno abajo.
            </p>
          </div>
        )}
      </section>

      {/* Available Plans */}
      {!inscripcionActual && (
        <section>
          <h2 className="font-anton text-3xl uppercase mb-6">PLANES DISPONIBLES</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {planes.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#131313] border-4 border-white p-6 shadow-brutal-lg flex flex-col justify-between"
              >
                <div>
                  <div className="font-mono text-[10px] text-neon-green uppercase mb-2 font-bold tracking-widest">
                    {plan.clases_incluidas === 1 ? 'Individual' : 'Mensual'}
                  </div>
                  <h3 className="font-anton text-3xl uppercase mb-4 leading-none">{plan.nombre}</h3>
                  <div className="font-anton text-5xl text-white mb-6">
                    ${plan.precio.toLocaleString()}
                  </div>
                  <ul className="space-y-2 mb-8 font-mono text-[10px] uppercase text-white/60">
                    <li className="flex items-center gap-2">
                      <span className="text-neon-green">⚡</span> {plan.clases_incluidas} clases incluidas
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-neon-green">⚡</span> Acceso a todos los horarios
                    </li>
                  </ul>
                </div>

                <button
                  disabled={isSubmitting}
                  onClick={() => handleSelectPlan(plan.id)}
                  className="btn-tape w-full py-3 font-anton uppercase text-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Procesando...' : 'Escoger Plan'}
                </button>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
