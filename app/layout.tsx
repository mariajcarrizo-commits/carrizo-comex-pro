import './globals.css'
import Navbar from './components/Navbar'

// 👇 ESTA ES LA MAGIA PARA EL LOGO DE LA PESTAÑA 👇
export const metadata = {
  title: 'CARRIZO Comex',
  description: 'Asistente Inteligente para Despachantes de Aduana',
  icons: {
    icon: '/logo.jpg', 
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
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  )
}