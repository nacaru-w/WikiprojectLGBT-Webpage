import { trigger, query, style, group, animateChild, animate, transition, state } from '@angular/animations';

export const footerAnimations =
    trigger('footerAnimation', [
        state('closed', style({ display: 'none' })),
        state('open', style({ display: '' })),
        transition('open <=> closed', [
            animate('1s ease-in')
        ])
    ])
