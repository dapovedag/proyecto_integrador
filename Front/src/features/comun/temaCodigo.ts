/**
 * Tema de resaltado (prism-react-renderer) derivado de los tokens del sistema: nada de hex sueltos.
 * Identidad por rol sintáctico, con contraste AA sobre --panel-2.
 */
import type { PrismTheme } from "prism-react-renderer";
import { SERIES, T, alfa } from "@/charts/tema";

export const COLOR_CODIGO = {
  texto: T.text,
  comentario: T.text3,
  palabra: SERIES[3], // violeta: palabras clave
  funcion: T.accent2, // índigo legible: funciones y métodos
  cadena: SERIES[2], // turquesa: cadenas
  numero: SERIES[1], // naranja: números y booleanos
  clase: SERIES[4], // ocre: clases y decoradores
  puntuacion: T.text2,
} as const;

export const temaCodigo: PrismTheme = {
  plain: { color: COLOR_CODIGO.texto, backgroundColor: "transparent" },
  styles: [
    { types: ["comment", "prolog", "doctype", "cdata"], style: { color: COLOR_CODIGO.comentario, fontStyle: "italic" } },
    { types: ["keyword", "operator-word", "important", "atrule"], style: { color: COLOR_CODIGO.palabra } },
    { types: ["builtin", "function", "method"], style: { color: COLOR_CODIGO.funcion } },
    { types: ["string", "char", "attr-value", "regex", "triple-quoted-string", "string-interpolation"], style: { color: COLOR_CODIGO.cadena } },
    { types: ["number", "boolean", "constant"], style: { color: COLOR_CODIGO.numero } },
    { types: ["class-name", "decorator", "annotation", "property"], style: { color: COLOR_CODIGO.clase } },
    { types: ["punctuation", "operator"], style: { color: COLOR_CODIGO.puntuacion } },
    { types: ["format-spec", "conversion-option"], style: { color: alfa(SERIES[2], 0.8) } },
  ],
};
