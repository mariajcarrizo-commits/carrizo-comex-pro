export interface NCM {
  codigo: string;
  descripcion: string;
  di: string;
  iva: string;
  te: string;
  licencia: string;
  intervenciones?: string[];
}

export const ncmComunes: NCM[] = [
  {
    codigo: "8471.30.12",
    descripcion: "Tabletas (Tablets) de peso inferior a 1 kg",
    di: "0%", iva: "10.5%", te: "3%", licencia: "LA",
    intervenciones: ["Seguridad Eléctrica"]
  },
  {
    codigo: "8471.30.19",
    descripcion: "Las demás máquinas automáticas para procesamiento de datos, portátiles",
    di: "0%", iva: "10.5%", te: "3%", licencia: "LNA",
    intervenciones: ["Seguridad Eléctrica"]
  },
  {
    codigo: "8517.13.00",
    descripcion: "Teléfonos inteligentes (Smartphones)",
    di: "16%", iva: "21%", te: "3%", licencia: "LNA",
    intervenciones: ["ENACOM", "Seguridad Eléctrica"]
  },
  {
    codigo: "3824.99.90",
    descripcion: "Productos químicos y preparaciones de la industria química (Aditivos)",
    di: "14%", iva: "21%", te: "3%", licencia: "LA",
    intervenciones: ["SEDRONAR", "ANMAT"]
  }
];