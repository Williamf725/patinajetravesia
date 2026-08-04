import HeroClient from '@/components/sections/HeroClient';
import SeguroClient from '@/components/sections/SeguroClient';
import EsenciaSection from '@/components/sections/EsenciaSection';
import TvSection from '@/components/sections/TvSection';
import EntrenamientosSection from '@/components/sections/EntrenamientosSection';
import UneteSection from '@/components/sections/UneteSection';
import TiendaPreview from '@/components/sections/TiendaPreview';

export default function Home() {
  return (
    <>
      {/* Hero animado en componente de cliente */}
      <HeroClient />

      {/* Sección preview tienda (Server Component) */}
      <TiendaPreview />

      {/* Sección seguro (Cliente) */}
      <SeguroClient />

      {/* Secciones del home */}
      <EsenciaSection />
      <TvSection />
      <EntrenamientosSection />
      <UneteSection />
    </>
  );
}
