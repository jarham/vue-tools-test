import {App, inject} from 'vue';

const key = Symbol('plugin-y-cursors');

export interface CursorOpts {
  userId: string;
  color: string;
  name: string;
}

export interface TextCursorOpts extends CursorOpts {
  target: HTMLElement;
  container?: HTMLElement;
}

interface CursorOps {
  discard(c: Cursor<T>): void;
}

abstract class Cursor<T = void> {
  private readonly _userId: string;
  private _color: string;
  private _name: string;
  private readonly _discard: (c: Cursor<T>) => void;
  private _discarded = false;

  constructor(
    private readonly _cursorId: string,
    opts: CursorOpts & CursorOps,
  ) {
    this._userId = opts.userId;
    this._color = opts.color;
    this._name = opts.name;
    this._discard = opts.discard;
  }

  get cursorId(): string {
    return this._cursorId;
  }

  get userId(): string {
    return this._userId;
  }

  get color(): string {
    return this._color;
  }

  set color(c: string) {
    this._color = c;
  }

  get name(): string {
    return this._name;
  }

  set name(n: string) {
    this._name = n;
  }

  get discarded(): boolean {
    return this._discarded;
  }

  discard(): void {
    this._discard(this);
    this._discarded = true;
  }

  abstract redraw(t: T): void;
}

export interface TextCursorRange {
  startNode: Node;
  startOffset: number;
  endNode: Node;
  endOffset: number;
}

export interface TextCursorUpdate {
  ranges: TextCursorRange[];
  name?: string;
  color?: string;
}

interface TextCursorElems {
  curWrap: HTMLDivElement;
  curName: HTMLDivElement;
  curCaret: HTMLDivElement;
}

export class TextCursor extends Cursor<{
  startNode: ChildNode;
  endNode: ChildNode;
}> {
  private readonly target: HTMLElement;
  private readonly container: HTMLElement;
  private readonly active: TextCursorElems[] = [];
  private readonly passive: TextCursorElems[] = [];
  private lastUpdate: TextCursorUpdate | null = null;

  constructor(cursorId: string, opts: TextCursorOpts & CursorOps) {
    super(cursorId, opts);

    this.target = opts.target;
    this.container = opts.container || document.body;
  }

  private createCursorElems(): TextCursorElems {
    const curWrap = document.createElement('div');
    curWrap.classList.add('y-cursor', 'y-cursor-wrap', 'y-cursor-text');
    const curName = document.createElement('div');
    curName.classList.add('y-cursor', 'y-cursor-name');
    curName.style.backgroundColor = this.color;
    const curCaret = document.createElement('div');
    curCaret.classList.add('y-cursor', 'y-cursor-caret');
    curCaret.style.backgroundColor = this.color;
    curWrap.appendChild(curName);
    curWrap.appendChild(curCaret);

    this.container.appendChild(curWrap);

    return {curWrap, curName, curCaret};
  }

  private getCursorElems(): TextCursorElems {
    let elems = this.passive.pop();
    if (!elems) {
      elems = this.createCursorElems();
    }
    return elems;
  }

  private useCursorElems(i: number): TextCursorElems {
    let elems = this.active[i];
    if (!elems) {
      elems = this.getCursorElems();
      this.active[i] = elems;
    }
    elems.curWrap.style.display = 'inline-block';
    return elems;
  }

  private unuseCursorElems(i: number) {
    if (this.active[i]) {
      const elems = this.active[i] as TextCursorElems;
      this.passive.push(elems);
      this.active.splice(i, 1);
      elems.curWrap.style.display = 'none';
    }
  }

  private updateCursorElems(
    elems: TextCursorElems,
    r: DOMRect,
    color: string,
    name: string,
  ) {
    // Keep caret/selectin (almost) within target element.
    const er = this.target.getBoundingClientRect();

    const top = Math.max(r.top, er.top);
    const left = Math.min(Math.max(r.left, er.left), er.right);
    const width =
      left > r.left
        ? Math.min(r.width, er.width - (r.left - er.left)) - (left - r.left)
        : Math.min(r.width, er.width - (r.left - er.left));

    elems.curWrap.style.top = `${top}px`;
    elems.curWrap.style.left = `${left}px`;

    elems.curCaret.style.height = `${r.height}px`;
    if (r.width < 2) {
      // NOTE: width from css may/will cause caret to overflow target element a bit
      elems.curCaret.style.removeProperty('width');
      elems.curCaret.style.opacity = `0.5`;
    } else {
      elems.curCaret.style.width = `${width}px`;
      elems.curCaret.style.opacity = `0.4`;
    }
    elems.curCaret.style.backgroundColor = color;

    elems.curName.textContent = name;
    // elems.curName.style.bottom = `${r.height}px`;
  }

  private discardCursorElems(elems: TextCursorElems): void {
    elems.curCaret.remove();
    elems.curName.remove();
    elems.curWrap.remove();
  }

  discard() {
    super.discard();
    this.active.forEach((c) => this.discardCursorElems(c));
    this.passive.forEach((c) => this.discardCursorElems(c));
    this.active.splice(0, this.active.length);
    this.passive.splice(0, this.passive.length);
  }

  update(u: TextCursorUpdate): void {
    console.log('update enter:', this);
    if (this.discarded) return;
    this.lastUpdate = u;
    if (typeof u.name === 'string') this.name = u.name;
    if (typeof u.color === 'string') this.color = u.color;

    const ranges = u.ranges.map((r) => {
      const rn = document.createRange();
      rn.setStart(r.startNode, r.startOffset);
      rn.setEnd(r.endNode, r.endOffset);
      return rn;
    });
    const rectsArr = ranges.map((r) => Array.from(r.getClientRects()));
    const rects: DOMRect[] = Array.prototype.concat.apply([], rectsArr);
    const m = Math.max(this.active.length, rects.length);

    for (let i = m - 1; i >= 0; i--) {
      const r = rects[i];
      if (r) {
        const elems = this.useCursorElems(i);
        this.updateCursorElems(elems, r, this.color, this.name);
      } else {
        this.unuseCursorElems(i);
      }
    }
    console.log('update exit:', this);
  }

  redraw(nodes: {startNode: ChildNode; endNode: ChildNode}) {
    if (this.discarded || !this.lastUpdate) return;
    const ranges = this.lastUpdate.ranges.map((r) => ({
      ...r,
      startNode: nodes.startNode,
      endNode: nodes.endNode,
    }));
    this.update({ranges});
  }
}

export class YCursors {
  private static cn = 0;
  private cursorsByUserId = new Map<string, Cursor[]>();
  private cursorById = new Map<string, Cursor>();

  private storeCursor(c: Cursor, userId: string) {
    if (!this.cursorsByUserId.has(userId)) {
      this.cursorsByUserId.set(userId, [c]);
    } else {
      this.cursorsByUserId.get(userId)?.push(c);
    }
    this.cursorById.set(c.cursorId, c);
  }

  private discard(c: Cursor): void {
    const userCursors = this.cursorsByUserId.get(c.userId);
    if (userCursors) {
      for (let i = userCursors.length - 1; i >= 0; i--) {
        const c2 = userCursors[i];
        if (c2.cursorId === c.cursorId) userCursors.splice(i, 1);
      }
    }

    this.cursorById.delete(c.cursorId);
  }

  createTextCursor(opts: TextCursorOpts): TextCursor {
    const c = new TextCursor(`c-${YCursors.cn++}`, {
      ...opts,
      discard: (c) => this.discard(c),
    });
    this.storeCursor(c, opts.userId);
    return c;
  }

  install(app: App): void {
    app.provide(key, this);
  }
}

export function createYCursors(): YCursors {
  return new YCursors();
}

export function useYCursors(): YCursors {
  const yc: YCursors | undefined = inject(key);
  if (!yc) throw new Error('YCursors not set');
  return yc;
}
