/**
 * Metadatos de los 19 campos de la solicitud (contrato ClienteRequest): etiquetas legibles con tildes,
 * grupo, control y rango del control. La validación usa SIEMPRE el esquema (features/api/validacion.ts):
 * el rango del deslizador es práctico, el del esquema manda.
 */
import { cop, dec, num, pct } from "@/charts/formatos";

export type GrupoCampo = "perfil" | "finanzas" | "solicitud";
export type Control = "deslizador" | "opciones" | "lista" | "texto";

export interface Campo {
  id: string;
  etiqueta: string;
  grupo: GrupoCampo;
  control: Control;
  ayuda?: string;
  min?: number;
  max?: number;
  paso?: number;
  entero?: boolean;
  formato?: (v: number) => string;
  /** Unidad corta junto al número editable. */
  unidad?: string;
  opciones?: { valor: string | null; etiqueta: string }[];
  nulable?: boolean;
}

export const GRUPOS: { id: GrupoCampo; titulo: string; detalle: string }[] = [
  { id: "perfil", titulo: "Perfil", detalle: "Quién solicita" },
  { id: "finanzas", titulo: "Finanzas", detalle: "Capacidad y comportamiento de pago" },
  { id: "solicitud", titulo: "Solicitud", detalle: "Qué pide y para qué" },
];

const anios = (v: number) => `${num(v, 1)} ${v === 1 ? "año" : "años"}`;

export const CAMPOS: Campo[] = [
  /* Perfil */
  { id: "edad", etiqueta: "Edad", grupo: "perfil", control: "deslizador", min: 18, max: 90, paso: 1, entero: true, formato: (v) => `${num(v)} años`, unidad: "años" },
  {
    id: "sexo",
    etiqueta: "Sexo",
    grupo: "perfil",
    control: "opciones",
    nulable: true,
    ayuda: "Solo auditoría de equidad: no entra al modelo.",
    opciones: [
      { valor: "F", etiqueta: "Mujer" },
      { valor: "M", etiqueta: "Hombre" },
      { valor: null, etiqueta: "Sin dato" },
    ],
  },
  {
    id: "estado_civil",
    etiqueta: "Estado civil",
    grupo: "perfil",
    control: "lista",
    opciones: [
      { valor: "Soltero", etiqueta: "Soltero(a)" },
      { valor: "Casado", etiqueta: "Casado(a)" },
      { valor: "Union_libre", etiqueta: "Unión libre" },
      { valor: "Divorciado", etiqueta: "Divorciado(a)" },
      { valor: "Viudo", etiqueta: "Viudo(a)" },
    ],
  },
  {
    id: "nivel_educativo",
    etiqueta: "Nivel educativo",
    grupo: "perfil",
    control: "lista",
    opciones: [
      { valor: "Primaria", etiqueta: "Primaria" },
      { valor: "Secundaria", etiqueta: "Secundaria" },
      { valor: "Tecnico", etiqueta: "Técnico" },
      { valor: "Universitario", etiqueta: "Universitario" },
      { valor: "Posgrado", etiqueta: "Posgrado" },
    ],
  },
  { id: "personas_a_cargo", etiqueta: "Personas a cargo", grupo: "perfil", control: "deslizador", min: 0, max: 10, paso: 1, entero: true, formato: (v) => num(v) },
  {
    id: "tipo_vivienda",
    etiqueta: "Vivienda",
    grupo: "perfil",
    control: "opciones",
    nulable: true,
    opciones: [
      { valor: "Propia", etiqueta: "Propia" },
      { valor: "Arriendo", etiqueta: "Arriendo" },
      { valor: "Familiar", etiqueta: "Familiar" },
    ],
  },
  /* Finanzas */
  {
    id: "situacion_laboral",
    etiqueta: "Situación laboral",
    grupo: "finanzas",
    control: "opciones",
    nulable: true,
    opciones: [
      { valor: "Empleado", etiqueta: "Empleado" },
      { valor: "Independiente", etiqueta: "Independiente" },
      { valor: "Pensionado", etiqueta: "Pensionado" },
      { valor: "Desempleado", etiqueta: "Desempleado" },
    ],
  },
  { id: "antiguedad_laboral_anios", etiqueta: "Antigüedad laboral", grupo: "finanzas", control: "deslizador", min: 0, max: 40, paso: 0.5, formato: anios, unidad: "años" },
  {
    id: "ingreso_mensual",
    etiqueta: "Ingreso mensual",
    grupo: "finanzas",
    control: "deslizador",
    min: 500000,
    max: 20000000,
    paso: 50000,
    formato: (v) => cop(v),
    unidad: "COP",
  },
  {
    id: "relacion_deuda_ingreso",
    etiqueta: "Relación deuda / ingreso",
    grupo: "finanzas",
    control: "deslizador",
    min: 0,
    max: 2,
    paso: 0.01,
    formato: (v) => dec(v, 2),
    ayuda: "Deuda total sobre ingreso anual.",
  },
  { id: "puntaje_buro", etiqueta: "Puntaje de buró", grupo: "finanzas", control: "deslizador", min: 150, max: 950, paso: 1, formato: (v) => num(v) },
  { id: "uso_cupo_tarjetas", etiqueta: "Uso del cupo de tarjetas", grupo: "finanzas", control: "deslizador", min: 0, max: 1, paso: 0.01, formato: (v) => pct(v, 0) },
  { id: "num_creditos_activos", etiqueta: "Créditos activos", grupo: "finanzas", control: "deslizador", min: 0, max: 15, paso: 1, entero: true, formato: (v) => num(v) },
  { id: "moras_ultimos_12m", etiqueta: "Moras últimos 12 meses", grupo: "finanzas", control: "deslizador", min: 0, max: 12, paso: 1, entero: true, formato: (v) => num(v) },
  /* Solicitud */
  {
    id: "monto_credito",
    etiqueta: "Monto solicitado",
    grupo: "solicitud",
    control: "deslizador",
    min: 1000000,
    max: 150000000,
    paso: 500000,
    formato: (v) => cop(v),
    unidad: "COP",
  },
  { id: "plazo_meses", etiqueta: "Plazo", grupo: "solicitud", control: "deslizador", min: 6, max: 120, paso: 1, entero: true, formato: (v) => `${num(v)} meses`, unidad: "meses" },
  { id: "tasa_interes_anual", etiqueta: "Tasa de interés anual", grupo: "solicitud", control: "deslizador", min: 0, max: 60, paso: 0.1, formato: (v) => `${num(v, 1)} %`, unidad: "%" },
  {
    id: "proposito",
    etiqueta: "Propósito",
    grupo: "solicitud",
    control: "lista",
    opciones: [
      { valor: "Libre_inversion", etiqueta: "Libre inversión" },
      { valor: "Vehiculo", etiqueta: "Vehículo" },
      { valor: "Consolidacion_deuda", etiqueta: "Consolidación de deuda" },
      { valor: "Vivienda", etiqueta: "Vivienda" },
      { valor: "Negocio", etiqueta: "Negocio" },
      { valor: "Educacion", etiqueta: "Educación" },
    ],
  },
  { id: "texto_solicitud", etiqueta: "Texto de la solicitud", grupo: "solicitud", control: "texto", nulable: true, ayuda: "Lo analiza el modelo de texto (TF-IDF + regresión logística)." },
];

export const CAMPO = Object.fromEntries(CAMPOS.map((c) => [c.id, c])) as Record<string, Campo>;

/** Nombre legible de una variable del modelo (incluye las derivadas). */
export const NOMBRE_VARIABLE: Record<string, string> = {
  ...Object.fromEntries(CAMPOS.map((c) => [c.id, c.etiqueta])),
  cuota_estimada: "Cuota estimada",
  ratio_cuota_ingreso: "Cuota / ingreso",
  ratio_monto_ingreso: "Monto / ingreso",
  rango_edad: "Rango de edad",
  tiene_moras_previas: "Tiene moras previas",
};

export function etiquetaOpcion(id: string, v: unknown): string {
  const c = CAMPO[id];
  const o = c?.opciones?.find((x) => x.valor === v);
  return o ? o.etiqueta : v == null ? "Sin dato" : String(v);
}

/** Variables numéricas que admiten el barrido "¿Qué pasa si…?". */
export const BARRIBLES = CAMPOS.filter((c) => c.control === "deslizador").map((c) => c.id);
