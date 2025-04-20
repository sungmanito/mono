const currencyMap = new Map<string, Intl.NumberFormat>();

export function formatNumber(num: number, format: string = 'USD'): string {
  if (!currencyMap.has(format)) {
    currencyMap.set(
      format,
      new Intl.NumberFormat(undefined, { style: 'currency', currency: format }),
    );
  }
  const formatter = currencyMap.get(format);
  if (formatter) return formatter.format(num);
  else return `${num}`;
}

const ordinalMap = new Map([
  ['one', 'st'],
  ['two', 'nd'],
  ['few', 'rd'],
  ['other', 'th'],
]);

const pluralFormatter = new Intl.PluralRules(undefined, { type: 'ordinal' });

export function ordinalSuffix(num: number): string {
  const selected = pluralFormatter.select(num);
  const ret = ordinalMap.get(selected);
  if (!ret) return 'th';

  return ret;
}
