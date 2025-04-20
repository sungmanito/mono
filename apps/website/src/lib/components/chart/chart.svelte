<script lang="ts">
  import { onMount } from 'svelte';
  let canvas: HTMLCanvasElement | null = $state(null);
  onMount(() => {
    // @ts-expect-error included globally
    new Chart(canvas!, {
      type: 'line',
      data: {
        labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
        datasets: [
          {
            label: '# of Votes',
            data: [150, 150, 170, 150, 200, 250],
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  });
</script>

<div>
  <canvas bind:this={canvas}></canvas>
</div>
