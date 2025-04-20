<script lang="ts" module>
  export type ChartProps<
    TType extends ChartType = ChartType,
    TData = DefaultDataPoint<TType>,
    TLabel = unknown,
  > = {
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
    labels,
    datasets,
    options,
    plugins,
  }: ChartProps<TType, DefaultDataPoint<TType>, TLabel> = $props();

  let canvas: HTMLCanvasElement | null = $state(null);
  let chartInstance: Chart<TType, TData, TLabel> | null = $state(null);

  Chart.register(Colors);
  onMount(() => {
    chartInstance = new Chart<TType, TData, TLabel>(canvas!, {
      data: {
        labels,
        datasets,
      },
      options,
      plugins,
    });
  });

  $inspect(chartInstance);
</script>

<div>
  <canvas bind:this={canvas}></canvas>
</div>
