import { Component, signal } from '@angular/core';

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
    { id: 'uran', label: 'Hoch angereichertes Uran ☢️', active: false},
    { id: 'mathe', label: 'Mathe II', active: false},
    { id: 'timmy-1', label: 'Timmy der Wal (lebendig)', active: false},
    { id: 'timmy-2', label: 'Timmy der Wal (Kadaver)', active: false},
    { id: 'se', label: 'Software Engineering (Modul)', active: false},
    { id: 'wipraeko', label: 'Wissenschaftliche Präsentation und Kommunikation (Modul)', active: false},
    { id: 'php2shell', label: 'PHP2Shell (Sicherheitslücke)', active: false},
    { id: 'horstl', label: 'HORSTL (Hochschul Organisations System für Studium und Lehre)', active: false},
    { id: 'brine', label: 'Heiße Glühbirne (Essen)', active: false},
  ]);

  protected readonly wobbleActive = signal(false);
  protected readonly previousRejected = signal(false);
  protected readonly overlayVisible = signal(false);
  protected readonly timeoutId = signal<NodeJS.Timeout | null>(null);

  protected toggle(optionId: string): void {
    const current = this.options();
    const nextOptions = current.map((option) =>
      option.id === optionId ? { ...option, active: !option.active } : option
    );
    const nextRejected = nextOptions.some((option) => this.conditionRejected(option));

    this.options.set(nextOptions);

    const shouldWobble = nextRejected !== this.previousRejected();
    this.previousRejected.set(nextRejected);

    if (shouldWobble) {
      this.wobbleActive.set(true);
      globalThis.setTimeout(() => this.wobbleActive.set(false), 350);
    }

    if (nextRejected) {
      this.timeoutId.set(globalThis.setTimeout(() => this.overlayVisible.set(true), 1000));
    } else {
      if (this.timeoutId()) clearTimeout(this.timeoutId() || -1);
      this.overlayVisible.set(false);
    }
  }

  protected get isRejected(): boolean {
    return this.options().some((option) => this.conditionRejected(option));
  }

  protected conditionRejected(option: ConfigOption): boolean {
    return (option.id === 'tierkadaver' || option.id === 'timmy-2') && option.active
  }
}
