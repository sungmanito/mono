<script lang="ts" module>
  export type ProgressProps = {
    end: number;
    pins: ProgressPins[];
    today?: Date;
  };

  export type ProgressPins = {
    status: 'pending' | 'paid';
    name: string;
    date: Date;
  };
</script>

<script lang="ts">
  import Tooltip from '$components/tooltip/tooltip.svelte';

  let { end = 28, pins = [], today }: ProgressProps = $props();
  const perDayDiff = $derived(100 / end);

  const groupedPins = $derived(
    pins.reduce(
      (all, cur) => {
        const date = cur.date.getDate();
        if (!all[date]) all[date] = [];
        all[date].push(cur);
        return all;
      },
      {} as Record<string, ProgressPins[]>,
    ),
  );

  const paidPercentage = $derived(
    (pins.filter((p) => p.status === 'paid').length / pins.length) * 100,
  );
</script>

<div class="timeline-wrap">
  <!-- pins injected by JS -->
  {#if today}
    <div class="progress-track">
      <div
        class="progress-fill"
        id="progressFill"
        style:width={`${paidPercentage}%`}
      ></div>
    </div>
    <div
      class="today-marker"
      style:left={`${perDayDiff * today.getDate()}%`}
    ></div>
  {/if}
  {#each Object.entries(groupedPins) as [date, datePins]}
    {@const dateNum = parseInt(date)}
    <div
      class={[
        'due-pin',
        {
          'all-paid': datePins.every((pin) => pin.status === 'paid'),
          'all-pending': datePins.every(
            (pin) => pin.status === 'pending' && today && pin.date < today,
          ),
          'all-pastdue': datePins.every(
            (pin) => pin.status === 'pending' && today && pin.date < today,
          ),
        },
      ]}
      style:left={`${(dateNum - 1) * perDayDiff}%`}
    >
      <Tooltip placement="top">
        {#snippet trigger()}
          {dateNum}
        {/snippet}
        {#snippet content()}
          <div class="popup-date">
            {datePins[0].date.toLocaleDateString(undefined, {
              month: 'short',
              year: 'numeric',
            })}
          </div>
          {#each datePins as pin}
            <div class="popup-item">
              <span
                class={[
                  'popup-dot',
                  {
                    pending:
                      pin.status === 'pending' &&
                      (!today || (today && pin.date > today)),
                    pastdue:
                      pin.status === 'pending' && today && pin.date < today,
                    paid: pin.status === 'paid',
                  },
                ]}>{pin.status}</span
              >
              {pin.name}
            </div>
          {/each}
        {/snippet}
      </Tooltip>
    </div>
  {/each}
</div>

<style>
  :root {
    --bg: #080c10;
    --surface: #0d1117;
    --surface2: #131920;
    --surface3: #1a2230;
    --border: rgba(255, 255, 255, 0.06);
    --border-bright: rgba(255, 255, 255, 0.13);
    --accent: #00e5a0;
    /* AAA contrast on #0d1117 (darkest surface): */
    --text-primary: #eef2f7; /* 17.4:1 ✓ */
    --text-secondary: #a8b8cc; /* 8.2:1  ✓ */
    --text-tertiary: #6e8099; /* 4.6:1  ✓ — used only for large/decorative text */
    --paid-color: #00e5a0; /* 9.4:1  ✓ */
    --pending-color: #7ab8d8; /* 7.1:1  ✓ */
    --pastdue-color: #ff7b7b; /* 7.3:1  ✓ */
    --font-head: 'Syne', sans-serif;
    --font-mono: 'DM Mono', monospace;
  }
  /* PROGRESS TIMELINE */

  .timeline-wrap {
    position: relative;
    height: 36px;
  }

  .progress-track {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    left: 0;
    right: 0;
    height: 4px;
    background: var(--surface3);
    border-radius: 99px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    width: 0%;
    background: linear-gradient(90deg, var(--accent), rgba(0, 229, 160, 0.5));
    border-radius: 99px;
    transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .today-marker {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 2px;
    height: 14px;
    background: var(--accent);
    border-radius: 99px;
    opacity: 0.5;
    pointer-events: none;
  }

  .due-pin {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    cursor: pointer;
    border: 1.5px solid;
    transition:
      transform 0.15s,
      box-shadow 0.15s;
    z-index: 2;
  }
  .due-pin.all-paid {
    background: rgba(0, 229, 160, 0.15);
    border-color: rgba(0, 229, 160, 0.5);
  }
  .due-pin.all-pending {
    background: rgba(122, 184, 216, 0.12);
    border-color: rgba(122, 184, 216, 0.4);
  }
  .due-pin.all-pastdue {
    background: rgba(255, 123, 123, 0.15);
    border-color: rgba(255, 123, 123, 0.5);
  }
  .due-pin.mixed {
    background: rgba(255, 190, 80, 0.12);
    border-color: rgba(255, 190, 80, 0.45);
  }
  .due-pin:hover {
    transform: translate(-50%, -50%) scale(1.3);
    box-shadow: 0 0 14px rgba(0, 0, 0, 0.6);
    z-index: 10;
  }

  .pin-popup {
    position: absolute;
    bottom: calc(100% + 10px);
    left: 50%;
    transform: translateX(-50%);
    background: #1a2333;
    border: 1px solid var(--border-bright);
    border-radius: 10px;
    padding: 10px 14px;
    min-width: 170px;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
    z-index: 100;
  }
  .pin-popup::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: #1a2333;
  }
  .due-pin:hover .pin-popup {
    opacity: 1;
  }

  .popup-date {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.1em;
    color: var(--text-secondary);
    text-transform: uppercase;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--border);
  }
  .popup-item {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-primary);
    padding: 3px 0;
  }
  .popup-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .popup-dot.paid {
    background: var(--paid-color);
  }
  .popup-dot.pending {
    background: var(--pending-color);
  }
  .popup-dot.pastdue {
    background: var(--pastdue-color);
  }

  .timeline-days {
    display: flex;
    justify-content: space-between;
    margin-top: 10px;
  }
  .day-label {
    font-family: var(--font-mono);
    font-size: 9px;
    color: var(--text-tertiary);
    letter-spacing: 0.05em;
  }

  .main {
    padding: 40px 48px 0;
  }
  .list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }
  .section-title {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.2em;
    color: var(--text-secondary);
    text-transform: uppercase;
  }

  .filter-tabs {
    display: flex;
    gap: 4px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 3px;
  }
  .tab {
    font-family: var(--font-mono);
    font-size: 11px;
    padding: 5px 12px;
    border-radius: 5px;
    cursor: pointer;
    color: var(--text-secondary);
    letter-spacing: 0.05em;
    transition: all 0.15s;
    border: none;
    background: none;
  }
  .tab.active {
    background: var(--surface3);
    color: var(--text-primary);
  }
  .tab:hover:not(.active) {
    color: var(--text-primary);
  }
</style>
