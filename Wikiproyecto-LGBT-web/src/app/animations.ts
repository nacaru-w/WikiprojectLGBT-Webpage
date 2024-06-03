import {
    animation, trigger, animateChild, group,
    transition, animate, style, query, state, stagger
} from '@angular/animations';

// Animations that work with routes
export const slideInAnimation =
    trigger('routeAnimations', [
        transition('* <=> *', [
            style({ position: 'relative' }),
            query(':enter, :leave', [
                style({
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                })
            ], { optional: true }),
            query(':enter', [
                style({ left: '-100%' })
            ], { optional: true }),
            query(':leave', animateChild(), { optional: true }),
            group([
                query(':leave', [
                    animate('200ms ease-out', style({ left: '100%', opacity: '1' }))
                ], { optional: true }),
                query(':enter', [
                    animate('300ms ease-out', style({ left: '0%' }))
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

export const fadeInAnimation =
    trigger('fadeIn', [
        state('hidden', style({
            opacity: 0,
        })),
        state('visible', style({
            opacity: 1,
        })),
        transition('hidden => visible', [
            animate('0.5s ease in')
        ])
    ]
    )

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