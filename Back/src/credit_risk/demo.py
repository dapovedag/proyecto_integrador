"""Clientes de demostración (bajo → aprobar, medio → revisar, alto → rechazar con el modelo v2).

Los usan el notebook 00, el exportador del front y las pruebas; su decisión se verifica en ``tests``.
"""

from __future__ import annotations

from typing import Any

CLIENTES_DEMO: dict[str, dict[str, Any]] = {
    "bajo": {"edad": 42, "sexo": "F", "estado_civil": "Casado", "nivel_educativo": "Posgrado",
             "situacion_laboral": "Empleado", "antiguedad_laboral_anios": 12.0, "personas_a_cargo": 1,
             "tipo_vivienda": "Propia", "ingreso_mensual": 9500000, "monto_credito": 15000000, "plazo_meses": 24,
             "tasa_interes_anual": 14.5, "proposito": "Educacion", "num_creditos_activos": 1, "moras_ultimos_12m": 0,
             "relacion_deuda_ingreso": 0.18, "puntaje_buro": 870, "uso_cupo_tarjetas": 0.12,
             "texto_solicitud": "Solicito el credito para financiar una maestria. Tengo un empleo estable desde hace "
                                "varios anios y he cumplido puntualmente con todas mis obligaciones anteriores."},
    "medio": {"edad": 33, "sexo": "M", "estado_civil": "Soltero", "nivel_educativo": "Tecnico",
              "situacion_laboral": "Independiente", "antiguedad_laboral_anios": 3.0, "personas_a_cargo": 2,
              "tipo_vivienda": "Arriendo", "ingreso_mensual": 3200000, "monto_credito": 18000000, "plazo_meses": 48,
              "tasa_interes_anual": 28.0, "proposito": "Libre_inversion", "num_creditos_activos": 3,
              "moras_ultimos_12m": 0, "relacion_deuda_ingreso": 0.5, "puntaje_buro": 650, "uso_cupo_tarjetas": 0.55,
              "texto_solicitud": "Quiero el credito para organizar mis gastos y hacer unas mejoras en mi negocio."},
    "alto": {"edad": 24, "sexo": "M", "estado_civil": "Soltero", "nivel_educativo": "Primaria",
             "situacion_laboral": "Desempleado", "antiguedad_laboral_anios": 0.0, "personas_a_cargo": 3,
             "tipo_vivienda": "Arriendo", "ingreso_mensual": 1100000, "monto_credito": 35000000, "plazo_meses": 72,
             "tasa_interes_anual": 38.5, "proposito": "Consolidacion_deuda", "num_creditos_activos": 5,
             "moras_ultimos_12m": 4, "relacion_deuda_ingreso": 1.25, "puntaje_buro": 380, "uso_cupo_tarjetas": 0.95,
             "texto_solicitud": "Necesito consolidar varias tarjetas de credito porque me atrase en los pagos tras "
                                "perder el empleo. Tengo deudas acumuladas y dificultades para cubrir la cuota."},
}
