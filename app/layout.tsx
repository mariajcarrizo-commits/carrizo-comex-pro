import './globals.css'
import Navbar from './components/Navbar'

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