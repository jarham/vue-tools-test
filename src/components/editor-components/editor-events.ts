interface EditorComponentEvent {
  cid: string;
}

export interface TextRange {
  start: number;
  end: number;
}

export interface TextSelectionChangeEvent extends EditorComponentEvent {
  ranges: TextRange[] | null;
}
