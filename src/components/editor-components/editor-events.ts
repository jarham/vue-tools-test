interface EditorComponentEvent {
  cid: string;
}

export interface TextSelectionChangeEvent extends EditorComponentEvent {
  start: number | null;
  end: number | null;
  oldStart?: number;
  oldEnd?: number;
}
