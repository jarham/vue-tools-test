export type SelectionType = 'text';

interface BaseSelection {
  type: SelectionType;
}

export interface TextSelection extends BaseSelection {
  type: 'text';
  start: number;
  end: number;
}

export type Selection = TextSelection;

export interface SelectionAware {
  setSelection: (
    userId: string,
    userName: string,
    selections: Selection[] | null,
  ) => void;
}
