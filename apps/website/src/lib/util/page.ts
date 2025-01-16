export type DrawerifyPage<Props> = {
  data: Props;
  onclose?: () => void;
  component?: boolean;
};

export type ModalifyPage<Props> = {
  data: Props;
  onclose?: () => void;
  component?: boolean;
};

export type MappedTo<Keys extends string, Item> = {
  [K in Keys]: Item[];
};
