import './globals.css'
import Navbar from './components/Navbar'
import AutoLogout from './components/AutoLogout'
import GuardiaSuscripcion from './components/GuardiaSuscripcion'

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
        <GuardiaSuscripcion>
          <Navbar />
          <AutoLogout />
          <main className="min-h-screen">{children}</main>
        </GuardiaSuscripcion>
      </body>
    </html>
  )
}