
type DateParts = {
  type: Intl.RelativeTimeFormatUnit;
  count: number;
};

const PARTS_MAP: DateParts[] = [
  {
    type: 'seconds',
    count: 60,
  },
  {
    type: 'minutes',
    count: 60,
  },
  {
    type: 'hours',
    count: 24,
  },
  {
    type: 'days',
    count: 7,
  },
  {
    type: 'weeks',
    count: 7,
  },
  {
    type: 'months',
    count: 12,
  },
  {
    type: 'years',
    count: Number.POSITIVE_INFINITY,
  },
];

const parser = new Intl.RelativeTimeFormat(undefined, {
  numeric: 'auto',
})

export function getFullTimeBetween(from: Date | number, to: Date | number = Date.now(), toParts = false) {
  const [fromTime, toTime] = [from, to].map( v=> v instanceof Date ? v.getTime() : v);

  const responseParts = [];
  // Clear the miliseconds from the timestamp
  let duration = (toTime - fromTime) / 1_000;

  for(const level of PARTS_MAP) {
    if(Math.abs(duration) < level.count) {
      responseParts.push(parser.format(Math.floor(duration), level.type));
    }
    duration /= level.count
  }

  return responseParts;

}