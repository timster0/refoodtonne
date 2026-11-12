import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the catalog question and toggle buttons', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain('Darf es in die Refood-Tonne?');
    expect(compiled.querySelectorAll('button').length).toBeGreaterThan(0);
  });

  it('should gray out the image when Tierkadaver is enabled', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const toggle = Array.from(compiled.querySelectorAll('.toggle-row'))
      .find((row) => row.textContent?.includes('Tierkadaver'))
      ?.querySelector('button') as HTMLButtonElement | undefined;

    toggle?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.tonne-image')?.classList.contains('grayscale')).toBe(true);
  });

  it('should switch to swipe mode and gray out the image when a Kadaver is swiped right', async () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    (compiled.querySelector('.mode-switch') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(compiled.querySelector('.swipe-card')).not.toBeNull();

    const like = compiled.querySelector('.swipe-btn.like') as HTMLButtonElement;
    const nope = compiled.querySelector('.swipe-btn.nope') as HTMLButtonElement;

    // Swipe until "Tierkadaver" is the top card, then swipe it right.
    while (!compiled.querySelector('.swipe-card.top')?.textContent?.includes('Tierkadaver')) {
      nope.click();
      vi.advanceTimersByTime(400);
      fixture.detectChanges();
    }
    expect(compiled.querySelector('.tonne-image')?.classList.contains('grayscale')).toBe(false);

    like.click();
    vi.advanceTimersByTime(400);
    fixture.detectChanges();
    expect(compiled.querySelector('.tonne-image')?.classList.contains('grayscale')).toBe(true);
    vi.useRealTimers();
  });
});
