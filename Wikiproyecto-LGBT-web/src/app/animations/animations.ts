import {
    animation, trigger, animateChild, group,
    transition, animate, style, query, state, stagger
} from '@angular/animations';

// Animations that work with routes
export const slideInAnimation =
    trigger('routeAnimations', [
        transition('* <=> *', [
            style({ position: 'relative' }),
            // Only the leaving view is pulled out of the flow, so it can overlap
            // the entering one and slide away.
            query(':leave', [
                style({
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                })
            ], { optional: true }),
            // The entering view stays in normal flow, so .main's (vertical)
            // centering already applies while it slides in. It just translates
            // horizontally — nothing snaps into place when the animation ends, so
            // there's no vertical "drop" once the new page settles.
            query(':enter', [
                style({ width: '100%', transform: 'translateX(-100%)' })
            ], { optional: true }),
            query(':leave', animateChild(), { optional: true }),
            group([
                query(':leave', [
                    animate('200ms ease-out', style({ left: '100%', opacity: '1' }))
                ], { optional: true }),
                query(':enter', [
                    animate('300ms ease-out', style({ transform: 'translateX(0)' }))
                ], { optional: true }),
                query('@*', animateChild(), { optional: true })
            ]),
        ])
    ]);

export const footerAnimations =
    trigger('footerAnimations', [
        state('visible', style({
            transform: 'translateY(0%)',
            opacity: 1
        })),
        state('hidden', style({
            transform: 'translateY(100%)',
            opacity: 0
        })),
        transition('visible => hidden', [
            animate('0.2s ease-out')
        ]),
        transition('hidden => visible', [
            animate('0.5s ease-in')
        ])
    ]);

// Fades an element in as a single block on enter (no per-child stagger).
export const fadeInAnimation =
    trigger('fadeIn', [
        transition(':enter', [
            style({ opacity: 0 }),
            animate('450ms ease-out', style({ opacity: 1 }))
        ])
    ])

// Opacity-only enter/leave. Mirrors the *effective* animation of the other stats
// sections: they use slideInOut, but their component hosts are inline so the
// translateX is ignored and only the opacity (300ms ease-in) actually runs. Used
// on the participants wrapper (a block <div>, where slideInOut would slide).
export const fadeInOutAnimation =
    trigger('fadeInOut', [
        transition(':enter', [
            style({ opacity: 0 }),
            animate('300ms ease-in', style({ opacity: 1 }))
        ]),
        transition(':leave', [
            animate('300ms ease-in', style({ opacity: 0 }))
        ])
    ])

export const popAnimation =
    trigger('popAnimation', [
        transition('* => *', [
            query(':enter', [
                style({ opacity: 0, transform: 'scale(0.5)' }),
                stagger(100, [
                    animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
                ])
            ], { optional: true })
        ])
    ])

export const chartsSlideInOutAnimation =
    trigger('slideInOut', [
        transition(':enter', [
            style({ transform: 'translateX(-100%)', opacity: 0 }),
            animate('300ms ease-in', style({ transform: 'translateX(0)', opacity: 1 }))
        ]),
        transition(':leave', [
            animate('300ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
        ])
    ])

export const buttonState =
    trigger('buttonState', [
        state('disabled', style({
            backgroundColor: '#cccccc',
            opacity: 0.5
        })),
        state('enabled', style({
            backgroundColor: '#b3efff',
            opacity: 1
        })),
        transition('disabled => enabled', [
            animate('0.5s ease-in')
        ]),
        transition('enabled => disabled', [
            animate('0.5s ease-in')
        ])
    ])