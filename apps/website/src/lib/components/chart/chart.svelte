<script lang="ts" module>
  export type ChartProps<
    TType extends ChartType = ChartType,
    TData = DefaultDataPoint<TType>,
    TLabel = unknown,
  > = {
    type: TType;
    labels: TLabel[];
    datasets: ChartDataset<TType, TData>[];
    options?: ChartOptions<TType>;
    plugins?: Plugin<TType>[];
  };
</script>

<script
  lang="ts"
  generics="TType extends ChartType = ChartType,
  TData = DefaultDataPoint<TType>,
  TLabel = unknown"
>
  import Chart, {
    Colors,
    type ChartDataset,
    type ChartOptions,
    type ChartType,
    type DefaultDataPoint,
    type Plugin,
  } from 'chart.js/auto';
  import { onMount } from 'svelte';

  let {
    type,
    labels,
    datasets,
    options,
    plugins,
  }: ChartProps<TType, TData, TLabel> = $props();

  let canvas: HTMLCanvasElement | null = $state(null);
  let chartInstance: Chart<TType, TData, TLabel> | null = $state(null);

  onMount(() => {
    Chart.register(Colors);
    chartInstance = new Chart<TType, TData, TLabel>(canvas!, {
      type,
      data: {
        labels,
        datasets,
      },
      options,
      plugins,
    });

    return () => {
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }
    };
  });

  $inspect(chartInstance);
</script>

<div>
  <canvas bind:this={canvas}></canvas>
</div>
