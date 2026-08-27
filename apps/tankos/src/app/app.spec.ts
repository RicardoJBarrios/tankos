import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AUTH_SESSION } from '@tankos/authn';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        {
          provide: AUTH_SESSION,
          useValue: { signOut: vi.fn(() => Promise.resolve()) },
        },
      ],
    }).compileComponents();
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.brand')?.textContent).toContain('TankOS');
    expect(compiled.querySelector('mat-toolbar')).not.toBeNull();
  });

  it('should expose navigation to every currently registered feature', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('a[href="/units"]')?.textContent).toContain(
      'Units',
    );
  });

  it('exposes the authentication logout action', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('[data-testid="logout"]')).not.toBeNull();
  });

  it('signs out through the configured authentication port', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const session = TestBed.inject(AUTH_SESSION);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    fixture.nativeElement.querySelector('[data-testid="logout"]').click();

    await vi.waitFor(() => {
      expect(session.signOut).toHaveBeenCalledOnce();
    });
  });

  it('does nothing when no authentication session is configured', () => {
    TestBed.overrideProvider(AUTH_SESSION, { useValue: null });
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('[data-testid="logout"]').click();
    expect(fixture.componentInstance).toBeDefined();
  });
});
