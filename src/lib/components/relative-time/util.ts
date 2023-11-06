
export const parser = new Intl.RelativeTimeFormat(undefined, {
  numeric: 'auto',
  style: 'short'
});

export type IntlLevel = {
  level: Intl.RelativeTimeFormatUnit;
  count: number;
}

export const intlLevels: IntlLevel[] = [
  {
    level: 'seconds',
    count: 60
  },
  {
    level: 'minutes',
    count: 60
  },
  {
    level: 'hours',
    count: 24
  },
  {
    level: 'days',
    count: 7
  },
  {
    level: 'weeks',
    count: 4
  },
  {
    level: 'months',
    count: 12
  },
  {
    level: 'years',
    count: Number.POSITIVE_INFINITY,
  },
];

export function parseToClosest(from: Date | number, to: Date|number = Date.now()) {
  console.info(from, to);
}