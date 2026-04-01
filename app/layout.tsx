import './globals.css'
import Navbar from './components/Navbar'
import AutoLogout from './components/AutoLogout' // 👈 ACÁ ESTÁ EL IMPORT (Le decimos dónde buscarlo)

// 👇 ESTA ES LA MAGIA PARA EL LOGO DE LA PESTAÑA 👇
export const metadata = {
  title: 'CARRIZO Comex',
  description: 'Asistente Inteligente para Despachantes de Aduana',
  icons: {
    icon: '/logo.jpg?v=2', 
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="bg-slate-900 text-slate-100">
        <Navbar />
        <AutoLogout /> {/* 👈 ACÁ COLOCAMOS LA PIEZA (El vigilante invisible) */}
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  )
}