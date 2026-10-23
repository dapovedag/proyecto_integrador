/**
 * Registro modular de ECharts: solo lo que usan las figuras nativas (no se importa "echarts" completo).
 */
import { BarChart, BoxplotChart, CustomChart, HeatmapChart, LineChart, PieChart, ScatterChart } from "echarts/charts";
import {
  AriaComponent,
  GridComponent,
  LegendComponent,
  MarkAreaComponent,
  MarkLineComponent,
  MarkPointComponent,
  TooltipComponent,
  VisualMapComponent,
} from "echarts/components";
import * as echarts from "echarts/core";
import { LabelLayout } from "echarts/features";
import { CanvasRenderer, SVGRenderer } from "echarts/renderers";
import { temaEcharts } from "./tema";

echarts.use([
  LineChart,
  BarChart,
  ScatterChart,
  BoxplotChart,
  HeatmapChart,
  PieChart,
  CustomChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  MarkLineComponent,
  MarkAreaComponent,
  MarkPointComponent,
  VisualMapComponent,
  AriaComponent,
  LabelLayout,
  CanvasRenderer,
  SVGRenderer,
]);

echarts.registerTheme("expediente", temaEcharts);

export { echarts };
export type { EChartsCoreOption as OpcionEcharts } from "echarts/core";
