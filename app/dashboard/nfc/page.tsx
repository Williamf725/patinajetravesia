'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { registrarAsistenciaNFC } from '@/app/auth/actions/nfc'

export default function NFCScanner() {
  const [escaneando, setEscaneando] = useState(false)
  const [resultado, setResultado] = useState<{
    tipo: 'exito' | 'error' | 'yaRegistrado'
    nombre?: string
    mensaje: string
  } | null>(null)
  const [diaClase, setDiaClase] = useState('miercoles')
  const [fechaClase, setFechaClase] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [nfcSoportado, setNfcSoportado] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined' && !('NDEFReader' in window)) {
      setNfcSoportado(false)
    }
  }, [])

  const iniciarEscaneo = async () => {
    if (!('NDEFReader' in window)) {
      setResultado({ tipo: 'error', mensaje: 'Tu navegador no soporta NFC. Usa Chrome en Android.' })
      return
    }

    try {
      setEscaneando(true)
      setResultado(null)

      // @ts-ignore — NDEFReader no tiene tipos oficiales aún
      const reader = new NDEFReader()
      await reader.scan()

      reader.onreadingerror = () => {
        setResultado({ tipo: 'error', mensaje: 'Error al leer la etiqueta. Intenta de nuevo.' })
        setEscaneando(false)
      }

      reader.onreading = async ({ serialNumber }: { serialNumber: string }) => {
        const nfcUid = serialNumber.toLowerCase().replace(/:/g, '')
        console.log('NFC leído:', nfcUid)
        await procesarNFC(nfcUid)
        setEscaneando(false)
      }

    } catch (error) {
      console.error('Error NFC:', error)
      setResultado({
        tipo: 'error',
        mensaje: 'No se pudo activar el NFC. Verifica que esté habilitado en tu celular.'
      })
      setEscaneando(false)
    }
  }

  const procesarNFC = async (nfcUid: string) => {
    const res = await registrarAsistenciaNFC({ nfcUid, diaClase, fechaClase })
    setResultado(res)
    // Vibración de feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(res.tipo === 'exito' ? [100, 50, 100] : [300])
    }
  }

  // UI
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a',
      display: 'flex', flexDirection: 'column', padding: '24px', maxWidth: '600px', margin: '0 auto' }}>

      {/* Volver al Dashboard */}
      <div style={{ marginBottom: '16px' }}>
        <Link
          href="/dashboard"
          style={{
            color: '#00ff88',
            fontFamily: 'Space Grotesk, monospace',
            fontSize: '13px',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 'bold',
            letterSpacing: '1px'
          }}
        >
          ← VOLVER AL DASHBOARD
        </Link>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <p style={{ color: '#ff2d78', fontFamily: 'Space Grotesk',
          fontSize: '11px', letterSpacing: '4px', margin: '0 0 8px', fontWeight: 'bold' }}>
          REGISTRO DE ASISTENCIA
        </p>
        <h1 style={{ color: '#fff', fontFamily: 'Anton',
          fontSize: '32px', margin: 0, letterSpacing: '-1px' }}>
          ESCANEO NFC
        </h1>
      </div>

      {/* Selectores de clase */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
        <input
          type="date"
          value={fechaClase}
          onChange={e => setFechaClase(e.target.value)}
          style={{ background: '#111', color: '#fff', border: '1px solid #333',
            padding: '14px 16px', fontFamily: 'Space Grotesk', fontSize: '16px',
            width: '100%', borderRadius: '0' }}
        />
        <select
          value={diaClase}
          onChange={e => setDiaClase(e.target.value)}
          style={{ background: '#111', color: '#fff', border: '1px solid #333',
            padding: '14px 16px', fontFamily: 'Space Grotesk', fontSize: '16px',
            width: '100%', borderRadius: '0' }}>
          <option value="miercoles">Miércoles — 2:30 PM a 4:30 PM</option>
          <option value="jueves">Jueves — 6:30 PM a 8:30 PM</option>
          <option value="sabado">Sábado — 4:00 PM a 6:00 PM</option>
        </select>
      </div>

      {/* Botón principal de escaneo */}
      {!nfcSoportado ? (
        <div style={{ background: 'rgba(255,45,120,0.1)', border: '2px solid #ff2d78',
          padding: '24px', textAlign: 'center' }}>
          <p style={{ color: '#ff2d78', fontFamily: 'Anton', fontSize: '20px', margin: '0 0 8px' }}>
            NFC NO DISPONIBLE
          </p>
          <p style={{ color: '#aaa', fontFamily: 'Space Grotesk', fontSize: '14px', margin: 0 }}>
            Usa Chrome en un dispositivo Android con NFC habilitado.
          </p>
        </div>
      ) : (
        <button
          onClick={iniciarEscaneo}
          disabled={escaneando}
          style={{
            background: escaneando ? '#111' : '#00ff88',
            color: escaneando ? '#00ff88' : '#000',
            border: escaneando ? '3px solid #00ff88' : '3px solid #00ff88',
            boxShadow: escaneando ? 'none' : '6px 6px 0 #ff2d78',
            padding: '32px',
            fontFamily: 'Anton',
            fontSize: '24px',
            letterSpacing: '2px',
            cursor: escaneando ? 'not-allowed' : 'pointer',
            width: '100%',
            transition: 'all 0.2s',
          }}>
          {escaneando ? (
            <span style={{ display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '48px' }}>📡</span>
              ACERCA EL STICKER NFC...
            </span>
          ) : (
            <span style={{ display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '48px' }}>📲</span>
              TOCAR PARA ESCANEAR
            </span>
          )}
        </button>
      )}

      {/* Resultado del escaneo */}
      {resultado && (
        <div style={{
          marginTop: '24px',
          background: resultado.tipo === 'exito'
            ? 'rgba(0,255,136,0.1)' : resultado.tipo === 'yaRegistrado'
            ? 'rgba(255,165,0,0.1)' : 'rgba(255,45,120,0.1)',
          border: `3px solid ${resultado.tipo === 'exito' ? '#00ff88'
            : resultado.tipo === 'yaRegistrado' ? 'orange' : '#ff2d78'}`,
          padding: '24px', textAlign: 'center',
        }}>
          <p style={{
            color: resultado.tipo === 'exito' ? '#00ff88'
              : resultado.tipo === 'yaRegistrado' ? 'orange' : '#ff2d78',
            fontFamily: 'Anton', fontSize: '28px', margin: '0 0 8px',
          }}>
            {resultado.tipo === 'exito' ? '✅ PRESENTE'
              : resultado.tipo === 'yaRegistrado' ? '⚠️ YA REGISTRADO'
              : '❌ ERROR'}
          </p>
          {resultado.nombre && (
            <p style={{ color: '#fff', fontFamily: 'Anton',
              fontSize: '22px', margin: '0 0 8px' }}>
              {resultado.nombre.toUpperCase()}
            </p>
          )}
          <p style={{ color: '#aaa', fontFamily: 'Space Grotesk',
            fontSize: '14px', margin: 0 }}>
            {resultado.mensaje}
          </p>
          {/* Botón para escanear el siguiente */}
          <button
            onClick={() => { setResultado(null); iniciarEscaneo() }}
            style={{ marginTop: '20px', background: 'transparent',
              color: '#fff', border: '1px solid #333',
              padding: '12px 32px', fontFamily: 'Space Grotesk',
              fontSize: '14px', letterSpacing: '2px', cursor: 'pointer', width: '100%' }}>
            SIGUIENTE ALUMNO →
          </button>
        </div>
      )}
    </div>
  )
}
