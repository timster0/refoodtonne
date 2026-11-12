import { Component, HostListener, computed, signal } from '@angular/core';

type ViewMode = 'classic' | 'tinder';
type SwipeDirection = 'left' | 'right';

const SWIPE_THRESHOLD = 110;
const FLY_OUT_MS = 320;

interface ConfigOption {
  id: string;
  label: string;
  active: boolean;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Refood-Check');
  protected readonly question = 'Darf es in die Refood-Tonne?';

  protected readonly options = signal<ConfigOption[]>([
    { id: 'Eier', label: 'Eier', active: false},
    { id: 'stinkefinger', label: 'Stinkefinger', active: false },
    { id: 'schaum', label: 'Schaum', active: false },
    { id: 'klingel', label: 'Klingel', active: false },
    { id: 'plutonium', label: 'Waffenfähiges Plutonium', active: false},
    { id: 'tierkadaver', label: 'Tierkadaver', active: false },
    { id: 'a.wagner', label: 'A. Wagner', active: false},
    { id: 'awtot', label: 'A. Wagner (Kadaver)', active: false },
    { id: 'uran', label: 'Hoch angereichertes Uran ☢️', active: false},
    { id: 'mathe', label: 'Mathe II', active: false},
    { id: 'timmy-1', label: 'Timmy der Wal (lebendig)', active: false},
    { id: 'timmy-2', label: 'Timmy der Wal (Kadaver)', active: false},
    { id: 'se', label: 'Software Engineering (Modul)', active: false},
    { id: 'wipraeko', label: 'Wissenschaftliche Präsentation und Kommunikation (Modul)', active: false},
    { id: 'php2shell', label: 'PHP2Shell (Sicherheitslücke)', active: false},
    { id: 'horstl', label: 'HORSTL (Hochschul Organisations System für Studium und Lehre)', active: false},
    { id: 'brine', label: 'Heiße Glühbirne (Essen)', active: false},
    { id: 'spannung', label: 'Spannungsabfall', active: false },
    { id: 'yobsti', label: 'Yobsti (Supermarkt)', active: false },
    { id: 'bigbox', label: 'ReFood Big Box (Speiserestebehälter)', active: false }
  ]);

  protected readonly wobbleActive = signal(false);
  protected readonly previousRejected = signal(false);
  protected readonly overlayVisible = signal(false);
  protected readonly timeoutId = signal<ReturnType<typeof setTimeout> | null>(null);

  // --- View mode -----------------------------------------------------------
  protected readonly mode = signal<ViewMode>('classic');

  protected toggleMode(): void {
    this.mode.update((m) => (m === 'classic' ? 'tinder' : 'classic'));
    this.resetDrag();
  }

  // --- Classic toggle view ---------------------------------------------------
  protected toggle(optionId: string): void {
    const option = this.options().find((o) => o.id === optionId);
    if (option) this.setActive(optionId, !option.active);
  }

  /** Sets an option's state and runs the shared wobble / overlay effects. */
  private setActive(optionId: string, active: boolean): void {
    this.applyOptions(
      this.options().map((option) => (option.id === optionId ? { ...option, active } : option))
    );
  }

  private applyOptions(nextOptions: ConfigOption[]): void {
    const nextRejected = nextOptions.some((option) => this.conditionRejected(option));

    this.options.set(nextOptions);

    const shouldWobble = nextRejected !== this.previousRejected();
    this.previousRejected.set(nextRejected);

    if (shouldWobble) {
      this.wobbleActive.set(true);
      globalThis.setTimeout(() => this.wobbleActive.set(false), 350);
    }

    const pending = this.timeoutId();
    if (pending) clearTimeout(pending);
    this.timeoutId.set(null);

    if (nextRejected) {
      this.timeoutId.set(globalThis.setTimeout(() => this.overlayVisible.set(true), 1000));
    } else {
      this.overlayVisible.set(false);
    }
  }

  // --- Tinder swipe view -----------------------------------------------------
  protected readonly deckIndex = signal(0);
  protected readonly dragX = signal(0);
  protected readonly dragY = signal(0);
  protected readonly dragging = signal(false);
  protected readonly flyOut = signal<SwipeDirection | null>(null);
  protected readonly lastSwipe = signal<{ label: string; direction: SwipeDirection } | null>(null);

  /** Current card plus up to two cards peeking out underneath. */
  protected readonly deck = computed(() => this.options().slice(this.deckIndex(), this.deckIndex() + 3));
  protected readonly deckDone = computed(() => this.deckIndex() >= this.options().length);

  /** -1 … 1, how far the current card is pulled towards a decision. */
  protected readonly swipeProgress = computed(() =>
    Math.max(-1, Math.min(1, this.dragX() / SWIPE_THRESHOLD))
  );

  protected readonly topCardTransform = computed(() => {
    const fly = this.flyOut();
    if (fly) {
      const dir = fly === 'right' ? 1 : -1;
      return `translate(${dir * 150}%, ${this.dragY()}px) rotate(${dir * 30}deg)`;
    }
    return `translate(${this.dragX()}px, ${this.dragY()}px) rotate(${this.dragX() / 14}deg)`;
  });

  private pointerStart: { x: number; y: number; id: number } | null = null;

  protected onPointerDown(event: PointerEvent): void {
    if (this.flyOut() || this.deckDone()) return;
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    this.pointerStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
    this.dragging.set(true);
  }

  protected onPointerMove(event: PointerEvent): void {
    if (!this.pointerStart || event.pointerId !== this.pointerStart.id) return;
    this.dragX.set(event.clientX - this.pointerStart.x);
    this.dragY.set((event.clientY - this.pointerStart.y) * 0.4);
  }

  protected onPointerUp(event: PointerEvent): void {
    if (!this.pointerStart || event.pointerId !== this.pointerStart.id) return;
    this.pointerStart = null;
    this.dragging.set(false);

    const dx = this.dragX();
    if (Math.abs(dx) >= SWIPE_THRESHOLD) {
      this.swipe(dx > 0 ? 'right' : 'left');
    } else {
      this.dragX.set(0);
      this.dragY.set(0);
    }
  }

  /** Right = ab in die Tonne (active), left = nope (inactive). */
  protected swipe(direction: SwipeDirection): void {
    const card = this.options()[this.deckIndex()];
    if (!card || this.flyOut()) return;

    this.flyOut.set(direction);
    this.setActive(card.id, direction === 'right');
    this.lastSwipe.set({ label: card.label, direction });

    globalThis.setTimeout(() => {
      this.deckIndex.update((i) => i + 1);
      this.resetDrag();
    }, FLY_OUT_MS);
  }

  protected restartDeck(): void {
    this.applyOptions(this.options().map((option) => ({ ...option, active: false })));
    this.deckIndex.set(0);
    this.lastSwipe.set(null);
    this.resetDrag();
  }

  private resetDrag(): void {
    this.pointerStart = null;
    this.dragging.set(false);
    this.flyOut.set(null);
    this.dragX.set(0);
    this.dragY.set(0);
  }

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if (this.mode() !== 'tinder') return;
    if (event.key === 'ArrowLeft') this.swipe('left');
    if (event.key === 'ArrowRight') this.swipe('right');
  }

  protected get isRejected(): boolean {
    return this.options().some((option) => this.conditionRejected(option));
  }

  protected conditionRejected(option: ConfigOption): boolean {
    return (option.id === 'tierkadaver' || option.id === 'timmy-2' || option.id === 'awtot') && option.active
  }
}
