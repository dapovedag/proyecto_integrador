/**
 * Mapa de capítulos: notebook del paso, componente especial y figuras nativas clave (por clave de
 * public/run/figuras.json). Los capítulos leen sus referencias de aquí y la prueba verifica que existan.
 * Referencia: "clave" (notebook del paso) o "NN:clave" (otro notebook).
 */
export interface DefCapitulo {
  nb: string | null;
  especial?: "DataExplorer" | "RunTerminal" | "SparkJob" | "ApiConsole" | "Integrador";
  figuras: Record<string, string>;
}

export const CAPITULOS: Record<number, DefCapitulo> = {
  1: {
    nb: "01",
    figuras: {
      costo: "costo_por_accion",
      edad: "impago_crudo_por_grupo_de_edad",
      sexo: "impago_crudo_por_sexo",
      civil: "impago_crudo_por_estado_civil",
    },
  },
  2: {
    nb: "02",
    especial: "DataExplorer",
    figuras: {
      dispersion: "dispersion_buro_cupo",
      histBuro: "hist_puntaje_buro_por_default",
      boxBuro: "box_puntaje_buro",
      boxCupo: "box_uso_cupo_tarjetas",
      boxDti: "box_relacion_deuda_ingreso",
      moras: "impago_por_moras",
      laboral: "impago_por_situacion_laboral",
      histIngreso: "hist_ingreso",
      histEdad: "hist_edad",
      dispIngreso: "dispersion_ingreso_monto",
    },
  },
  3: {
    nb: "03",
    especial: "DataExplorer",
    figuras: {
      nulos: "pct_nulos_por_columna",
      escOrig: "escalado_ingreso_mensual_original",
      escMinMax: "escalado_ingreso_mensual_minmaxscaler",
      escStd: "escalado_ingreso_mensual_standardscaler",
      seleccion: "seleccion_info_mutua",
      pca: "pca_varianza_acumulada",
      moras: "impago_por_tiene_moras_previas",
      ratio: "impago_por_ratio_cuota_ingreso",
    },
  },
  4: {
    nb: "04",
    especial: "DataExplorer",
    figuras: {
      segmentos: "segmentos_laboral_moras_buro",
      spearman: "sns_heatmap_spearman",
      scree: "pca_scree",
      pca2d: "pca_proyeccion_2d",
      capping: "capping_distribucion_ingreso_mensual",
      cappingBox: "capping_boxplot_ingreso_mensual",
      ranking: "ranking_variables",
      gg: "gg_impago_dti_moras_laboral",
      pearson: "correlacion_pearson_spearman",
    },
  },
  5: {
    nb: "05",
    figuras: {
      roc: "roc_clasicos",
      pr: "pr_clasicos",
      cv: "auc_cv_clasicos",
      coef: "coeficientes_lr",
      perm: "permutacion_lr",
      conf: "confusion_modelo_1",
      confDummy: "confusion_modelo_0",
    },
  },
  6: {
    nb: "06",
    figuras: {
      loss_mlp: "aprendizaje_loss_mlp",
      auc_mlp: "aprendizaje_auc_mlp",
      loss_cnn: "aprendizaje_loss_cnn1d",
      auc_cnn: "aprendizaje_auc_cnn1d",
      loss_gru: "aprendizaje_loss_gru_texto",
      auc_gru: "aprendizaje_auc_gru_texto",
      loss_hib: "aprendizaje_loss_hibrido",
      auc_hib: "aprendizaje_auc_hibrido",
      roc: "roc_test_dl",
      metricas: "clasicos_vs_dl_metricas",
      tiempo: "clasicos_vs_dl_tiempo",
    },
  },
  7: {
    nb: "07",
    figuras: {
      terminos: "terminos_asociados",
      bigramas: "frecuencia_bigramas",
      estrellas: "bert_estrellas_por_clase",
      sentimiento: "impago_por_sentimiento",
      st: "pca_2d_emb_st",
      gpt2: "pca_2d_emb_gpt2",
      roc: "roc_combinado_vs_tabular",
      delta: "delta_auc_bootstrap",
      quintil: "impago_quintil_texto",
    },
  },
  8: {
    nb: "08",
    especial: "RunTerminal",
    figuras: {
      comparacion: "comparacion_final",
      calibracion: "calibracion",
      costo: "curva_costo",
      precio: "precio_equidad",
      shap: "shap_global",
      aprobar: "caso_aprobar",
      revisar: "caso_revisar",
      rechazar: "caso_rechazar",
      psi: "psi_variables",
    },
  },
  9: {
    nb: "09",
    especial: "SparkJob",
    figuras: {
      roc: "spark_roc_mllib_vs_sklearn",
      metricas: "spark_metricas_mllib_vs_sklearn",
      particiones: "spark_filas_por_particion",
      laboral: "spark_tasa_impago_por_situacion_laboral",
      proposito: "spark_tasa_impago_por_proposito",
    },
  },
  10: {
    nb: null,
    especial: "ApiConsole",
    figuras: {},
  },
  11: {
    nb: "00",
    especial: "Integrador",
    figuras: {
      comparacion: "08:comparacion_final",
      costo: "08:curva_costo",
    },
  },
};
