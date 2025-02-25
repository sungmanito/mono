import { Chart, Colors } from 'chart.js';

class ChartData {
  isSetup = $state(false);
  constructor() {
    Chart.register(Colors);
    this.isSetup = true;
  }
}

export const chartData = new ChartData();
