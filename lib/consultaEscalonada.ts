// Consulta a varios modelos de IA de forma escalonada:
// el primero arranca de inmediato; si tarda o falla, se suman los siguientes
// (sin esperar a que el anterior termine de fallar). Gana el primero que responde bien.

export type OpcionesEscalonada<T> = {
  modelos: string[]
  /** Milisegundos de espera antes de sumar cada modelo (mismo orden que `modelos`). */
  retrasos: number[]
  /** Tiempo máximo total, en milisegundos. */
  limiteMs: number
  consultar: (modelo: string, timeoutMs: number) => Promise<T>
  onFallo?: (modelo: string, error: unknown) => void
}

export function consultarEscalonada<T>(op: OpcionesEscalonada<T>): Promise<{ resultado: T; modelo: string }> {
  return new Promise((resolve, reject) => {
    const inicio = Date.now()
    const lanzados = new Set<number>()
    const timers: ReturnType<typeof setTimeout>[] = []
    let terminado = false
    let fallos = 0
    let ultimoError: unknown = new Error('Sin respuesta de la IA')

    const cerrar = () => {
      terminado = true
      timers.forEach(clearTimeout)
    }

    const lanzar = (i: number) => {
      if (terminado || lanzados.has(i) || i >= op.modelos.length) return
      lanzados.add(i)
      const modelo = op.modelos[i]
      const restante = Math.max(3000, op.limiteMs - (Date.now() - inicio))
      op.consultar(modelo, restante)
        .then(resultado => {
          if (terminado) return
          cerrar()
          resolve({ resultado, modelo })
        })
        .catch(error => {
          ultimoError = error
          op.onFallo?.(modelo, error)
          fallos += 1
          if (terminado) return
          if (fallos >= op.modelos.length) {
            cerrar()
            reject(ultimoError)
            return
          }
          // Si uno falla, sumamos ya al siguiente que todavía no arrancó.
          const siguiente = op.modelos.findIndex((_, j) => !lanzados.has(j))
          if (siguiente >= 0) lanzar(siguiente)
        })
    }

    op.modelos.forEach((_, i) => {
      const retraso = op.retrasos[i] ?? 0
      if (retraso <= 0) lanzar(i)
      else timers.push(setTimeout(() => lanzar(i), retraso))
    })

    timers.push(setTimeout(() => {
      if (terminado) return
      cerrar()
      reject(ultimoError)
    }, op.limiteMs))
  })
}
