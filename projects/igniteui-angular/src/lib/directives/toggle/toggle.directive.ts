import {
    ChangeDetectorRef,
    Directive,
    ElementRef,
    EventEmitter,
    HostBinding,
    HostListener,
    Input,
    NgModule,
    OnDestroy,
    OnInit,
    Optional,
    Output,
    Inject,
    TemplateRef,
    ViewContainerRef,
    EmbeddedViewRef
} from '@angular/core';
import {
    Overlay,
    OverlayConfig,
    ScrollStrategy,
    OverlayRef,
    GlobalPositionStrategy as CDKGlobalPositionStrategy,
    FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { IgxNavigationService, IToggleView } from '../../core/navigation';
import { IgxOverlayService } from '../../services/overlay/overlay';
import {
    OverlaySettings,
    OverlayEventArgs,
    ConnectedPositioningStrategy,
    AbsoluteScrollStrategy,
    IPositionStrategy,
    GlobalPositionStrategy as IgxGlobalPositionStrategy,
    NoOpScrollStrategy,
    BlockScrollStrategy,
    CloseScrollStrategy,
    AutoPositionStrategy
} from '../../services';
import { filter, takeUntil } from 'rxjs/operators';
import { Subscription, Subject, MonoTypeOperatorFunction, from } from 'rxjs';
import { OverlayClosingEventArgs, VerticalAlignment, HorizontalAlignment, Point, OverlayAnimationEventArgs } from '../../services/overlay/utilities';
import { CancelableEventArgs, CancelableBrowserEventArgs } from '../../core/utils';
import { DeprecateProperty } from '../../core/deprecateDecorators';
import { CdkPortal, TemplatePortal } from '@angular/cdk/portal';
import { AnimationBuilder } from '@angular/animations';
import { ScrollDispatchModule } from '@angular/cdk/scrolling';
import { FlexibleConnectedPositionStrategyOrigin, ConnectedPosition } from '@angular/cdk/overlay/typings/position/flexible-connected-position-strategy';

@Directive({
    exportAs: 'toggle',
    selector: '[igxToggle]'
})
export class IgxToggleDirective implements IToggleView, OnInit, OnDestroy {
    protected _overlayId: string;
    private destroy$ = new Subject<boolean>();
    private _overlaySubFilter: [
        // MonoTypeOperatorFunction<OverlayEventArgs>,
        MonoTypeOperatorFunction<OverlayEventArgs>
    ] = [
            // filter(x => x.id === this._overlayId),
            takeUntil(this.destroy$)
        ];
    private _overlayOpenedSub: Subscription;
    private _overlayClosingSub: Subscription;
    private _overlayClosedSub: Subscription;
    private _overlayRef: OverlayRef;
    private _templatePortal: TemplatePortal;
    private _overlaySettings: OverlaySettings;
    private _view: EmbeddedViewRef<any>;

    /**
     * Emits an event after the toggle container is opened.
     *
     * ```typescript
     * onToggleOpened(event) {
     *    alert("Toggle opened!");
     * }
     * ```
     *
     * ```html
     * <div
     *   igxToggle
     *   (onOpened)='onToggleOpened($event)'>
     * </div>
     * ```
     */
    @Output()
    public onOpened = new EventEmitter();

    /**
     * Emits an event before the toggle container is opened.
     *
     * ```typescript
     * onToggleOpening(event) {
     *  alert("Toggle opening!");
     * }
     * ```
     *
     * ```html
     * <div
     *   igxToggle
     *   (onOpening)='onToggleOpening($event)'>
     * </div>
     * ```
     */
    @Output()
    public onOpening = new EventEmitter<CancelableEventArgs>();

    /**
     * Emits an event after the toggle container is closed.
     *
     * ```typescript
     * onToggleClosed(event) {
     *  alert("Toggle closed!");
     * }
     * ```
     *
     * ```html
     * <div
     *   igxToggle
     *   (onClosed)='onToggleClosed($event)'>
     * </div>
     * ```
     */
    @Output()
    public onClosed = new EventEmitter();

    /**
     * Emits an event before the toggle container is closed.
     *
     * ```typescript
     * onToggleClosing(event) {
     *  alert("Toggle closing!");
     * }
     * ```
     *
     * ```html
     * <div
     *  igxToggle
     *  (onClosing)='onToggleClosing($event)'>
     * </div>
     * ```
     */
    @Output()
    public onClosing = new EventEmitter<CancelableBrowserEventArgs>();

    @Output()
    public onAnimation = new EventEmitter<OverlayAnimationEventArgs>();

    private _collapsed = true;
    /**
     * @hidden
     */
    public get collapsed(): boolean {
        return this._collapsed;
    }

    /**
     * Identifier which is registered into `IgxNavigationService`
     *
     * ```typescript
     * let myToggleId = this.toggle.id;
     * ```
     */
    @Input()
    public id: string;

    /**
     * @hidden
     */
    public get element() {
        return this.elementRef.nativeElement;
    }

    /**
     * @hidden
     */
    @HostBinding('class.igx-toggle--hidden')
    @HostBinding('attr.aria-hidden')
    public get hiddenClass() {
        return this.collapsed;
    }

    /**
     * @hidden
     */
    @HostBinding('class.igx-toggle')
    public get defaultClass() {
        return !this.collapsed;
    }

    /**
     * @hidden
     */
    constructor(
        @Optional() private elementRef?: ElementRef,
        @Optional() private templateRef?: TemplateRef<any>,
        public viewContainerRef?: ViewContainerRef,
        private cdr?: ChangeDetectorRef,
        @Inject(IgxOverlayService) protected overlayService?: IgxOverlayService,
        public angularOverlay?: Overlay,
        private builder?: AnimationBuilder,
        private navigationService?: IgxNavigationService) {
    }

    /**
     * Opens the toggle.
     *
     * ```typescript
     * this.myToggle.open();
     * ```
     */
    public open(overlaySettings?: OverlaySettings) {
        if (!this._collapsed) {
            return;
        }
        //  if there is open animation do nothing
        //  if toggle is not collapsed and there is no close animation do nothing
        // const info = this.overlayService.getOverlayById(this._overlayId);
        // const hasOpenAnimation = info ? info.openAnimationPlayer : false;
        // const hasCloseAnimation = info ? info.closeAnimationPlayer : false;
        // if (hasOpenAnimation || !(this._collapsed || hasCloseAnimation)) {
        //     return;
        // }

        // if (!info) {
        //     this._overlayId = this.overlayService.attach(this.elementRef, overlaySettings);
        // }

        this._overlaySettings = overlaySettings;
        this._collapsed = false;
        this.cdr.detectChanges();

        const openEventArgs: CancelableEventArgs = { cancel: false };
        this.onOpening.emit(openEventArgs);
        if (openEventArgs.cancel) {
            this._collapsed = true;
            this.cdr.detectChanges();
            return;
        }

        // this.overlayService.show(this._overlayId, overlaySettings);
        const overlayConfig = this.translateOverlaySettingsToOverlayConfig(this._overlaySettings);
        this._overlayRef = this.angularOverlay.create(overlayConfig);

        if (overlaySettings.closeOnOutsideClick) {
            this._overlayRef.backdropClick().subscribe(() => {
                this.close();
            });
        }

        this._templatePortal = new TemplatePortal(this.templateRef, this.viewContainerRef);
        this._view = this._overlayRef.attach(this._templatePortal);

        if (overlaySettings.positionStrategy.settings.openAnimation) {
            this.playOpenAnimation(overlaySettings.positionStrategy.settings.openAnimation, this._view.rootNodes[0]);
        } else {
            this.onOpened.emit();
        }

        // this.unsubscribe();
        // this._overlayOpenedSub = this.overlayService.onOpened.pipe(...this._overlaySubFilter).subscribe(() => {
        //     this.onOpened.emit();
        // });

        // this._overlayClosingSub = this.overlayService
        //     .onClosing
        //     .pipe(...this._overlaySubFilter)
        //     .subscribe((e: OverlayClosingEventArgs) => {
        //         const eventArgs: CancelableBrowserEventArgs = { cancel: false, event: e.event };
        //         this.onClosing.emit(eventArgs);
        //         e.cancel = eventArgs.cancel;

        //         //  in case event is not canceled this will close the toggle and we need to unsubscribe.
        //         //  Otherwise if for some reason, e.g. close on outside click, close() gets called before
        //         //  onClosed was fired we will end with calling onClosing more than once
        //         if (!e.cancel) {
        //             this.clearSubscription(this._overlayClosingSub);
        //         }
        //     });

        // this._overlayClosedSub = this.overlayService.onClosed
        //     .pipe(...this._overlaySubFilter)
        //     .subscribe(this.overlayClosed);
    }

    /**
     * Closes the toggle.
     *
     * ```typescript
     * this.myToggle.close();
     * ```
     */
    public close() {
        if (this._collapsed) {
            return;
        }
        // //  if toggle is collapsed do nothing
        // //  if there is close animation do nothing, toggle will close anyway
        // const info = this.overlayService.getOverlayById(this._overlayId);
        // const hasCloseAnimation = info ? info.closeAnimationPlayer : false;
        // if (this._collapsed || hasCloseAnimation) {
        //     return;
        // }

        // this.overlayService.hide(this._overlayId);
        const closeEventArgs: CancelableEventArgs = { cancel: false };
        this.onClosing.emit(closeEventArgs);
        if (closeEventArgs.cancel) {
            return;
        }
        if (this._overlaySettings.positionStrategy.settings.openAnimation) {
            this.playCloseAnimation(this._overlaySettings.positionStrategy.settings.closeAnimation, this._view.rootNodes[0]);
        } else {
            this._overlayRef.detach();
            this._overlayRef.dispose();
            this._collapsed = true;
            this.onClosed.emit();
        }
    }

    /**
     * Opens or closes the toggle, depending on its current state.
     *
     * ```typescript
     * this.myToggle.toggle();
     * ```
     */
    public toggle(overlaySettings?: OverlaySettings) {
        //  if toggle is collapsed call open
        //  if there is close animation call open
        if (this.collapsed || this.isClosing) {
            this.open(overlaySettings);
        } else {
            this.close();
        }
    }

    translateOverlaySettingsToOverlayConfig(overlaySettings: OverlaySettings): OverlayConfig {
        const overlayConfig = new OverlayConfig();
        const postilionSettings = overlaySettings.positionStrategy.settings;

        if (overlaySettings.positionStrategy instanceof ConnectedPositioningStrategy) {
            let origin: FlexibleConnectedPositionStrategyOrigin;
            if (postilionSettings.target) {
                if (postilionSettings.target instanceof ElementRef) {
                    origin = postilionSettings.target as ElementRef;
                } else if (postilionSettings.target instanceof HTMLElement) {
                    origin = postilionSettings.target as HTMLElement;
                } else if (postilionSettings.target instanceof Point) {
                    origin = {
                        x: (postilionSettings.target as Point).x,
                        y: (postilionSettings.target as Point).y
                    };
                }
            }

            let originX: 'start' | 'center' | 'end';
            let originY: 'top' | 'center' | 'bottom';
            let overlayX: 'start' | 'center' | 'end';
            let overlayY: 'top' | 'center' | 'bottom';
            switch (postilionSettings.horizontalStartPoint) {
                case HorizontalAlignment.Left:
                    originX = 'start';
                    break;
                case HorizontalAlignment.Center:
                    originX = 'center';
                    break;
                case HorizontalAlignment.Right:
                    originX = 'end';
                    break;
            }

            switch (postilionSettings.verticalStartPoint) {
                case VerticalAlignment.Top:
                    originY = 'top';
                    break;
                case VerticalAlignment.Middle:
                    originY = 'center';
                    break;
                case VerticalAlignment.Bottom:
                    originY = 'bottom';
                    break;
            }

            switch (postilionSettings.horizontalDirection) {
                case HorizontalAlignment.Left:
                    overlayX = 'end';
                    break;
                case HorizontalAlignment.Center:
                    overlayX = 'center';
                    break;
                case HorizontalAlignment.Right:
                    overlayX = 'start';
                    break;
            }

            switch (postilionSettings.verticalDirection) {
                case VerticalAlignment.Top:
                    overlayY = 'bottom';
                    break;
                case VerticalAlignment.Middle:
                    overlayY = 'center';
                    break;
                case VerticalAlignment.Bottom:
                    overlayY = 'top';
                    break;
            }

            let positions: ConnectedPosition[] = [
                {
                    offsetX: 0,
                    offsetY: 0,
                    originX,
                    originY,
                    overlayX,
                    overlayY
                }
            ];

            if (overlaySettings.positionStrategy instanceof AutoPositionStrategy) {
                const autoOriginX: 'start' | 'center' | 'end' = originX === 'center' ? 'center' :
                    originX === 'start' ? 'end' : 'start';
                const autoOriginY: 'top' | 'center' | 'bottom' = originY === 'center' ? 'center' :
                    originY === 'top' ? 'bottom' : 'top';
                const autoOverlayX: 'start' | 'center' | 'end' = overlayX === 'center' ? 'center' :
                    overlayX === 'start' ? 'end' : 'start';
                const autoOverlayY: 'top' | 'center' | 'bottom' = overlayY === 'center' ? 'center' :
                    overlayY === 'top' ? 'bottom' : 'top';

                positions.push({
                    offsetX: 0,
                    offsetY: 0,
                    originX: autoOriginX,
                    originY:autoOriginY,
                    overlayX: autoOverlayX,
                    overlayY: autoOverlayY
                });
            }

            overlayConfig.positionStrategy = this.angularOverlay
                .position()
                .flexibleConnectedTo(origin)
                .withLockedPosition(true)
                .withPositions(positions);
        } else if (overlaySettings.positionStrategy instanceof IgxGlobalPositionStrategy) {
            overlayConfig.positionStrategy = this.angularOverlay
                .position()
                .global();
            switch (postilionSettings.horizontalDirection) {
                case HorizontalAlignment.Left:
                    (overlayConfig.positionStrategy as CDKGlobalPositionStrategy).left('0');
                    break;
                case HorizontalAlignment.Center:
                    (overlayConfig.positionStrategy as CDKGlobalPositionStrategy).centerHorizontally('0');
                    break;
                case HorizontalAlignment.Right:
                    (overlayConfig.positionStrategy as CDKGlobalPositionStrategy).right('0');
                    break;
            }

            switch (postilionSettings.verticalDirection) {
                case VerticalAlignment.Top:
                    (overlayConfig.positionStrategy as CDKGlobalPositionStrategy).top('0');
                    break;
                case VerticalAlignment.Middle:
                    (overlayConfig.positionStrategy as CDKGlobalPositionStrategy).centerVertically('0');
                    break;
                case VerticalAlignment.Bottom:
                    (overlayConfig.positionStrategy as CDKGlobalPositionStrategy).bottom('0');
                    break;
            }
        }

        if (overlaySettings.scrollStrategy instanceof NoOpScrollStrategy) {
            overlayConfig.scrollStrategy = this.angularOverlay.scrollStrategies.noop();
        } else if (overlaySettings.scrollStrategy instanceof BlockScrollStrategy) {
            overlayConfig.scrollStrategy = this.angularOverlay.scrollStrategies.block();
        } else if (overlaySettings.scrollStrategy instanceof CloseScrollStrategy) {
            overlayConfig.scrollStrategy = this.angularOverlay.scrollStrategies.close();
        } else if (overlaySettings.scrollStrategy instanceof AbsoluteScrollStrategy) {
            overlayConfig.scrollStrategy = this.angularOverlay.scrollStrategies.reposition();
        }

        if (overlaySettings.closeOnOutsideClick || overlaySettings.modal) {
            overlayConfig.hasBackdrop = true;
        }

        return overlayConfig;
    }

    private playOpenAnimation(openAnimation: any, element) {
        const animationBuilder = this.builder.build(openAnimation);
        const openAnimationPlayer = animationBuilder.create(element);
        openAnimationPlayer.onDone(() => {
            if (openAnimationPlayer) {
                openAnimationPlayer.reset();
            }
            this.onOpened.emit();
        });

        this.onAnimation.emit({ id: this.id, animationPlayer: openAnimationPlayer, animationType: 'open' });
        openAnimationPlayer.play();
    }

    private playCloseAnimation(closeAnimation: any, element) {
        const animationBuilder = this.builder.build(closeAnimation);
        const closeAnimationPlayer = animationBuilder.create(element);

        closeAnimationPlayer.onDone(() => {
            if (closeAnimationPlayer) {
                closeAnimationPlayer.reset();
            }
            this._overlayRef.detach();
            this._overlayRef.dispose();
            this._collapsed = true;
            this.onClosed.emit();
        });

        this.onAnimation.emit({ id: this.id, animationPlayer: closeAnimationPlayer, animationType: 'close' });
        closeAnimationPlayer.play();
    }

    /** @hidden @internal */
    public get isClosing() {
        const info = this.overlayService.getOverlayById(this._overlayId);
        return info ? info.closeAnimationPlayer : false;
    }

    /**
     * Repositions the toggle.
     * ```typescript
     * this.myToggle.reposition();
     * ```
     */
    public reposition() {
        this.overlayService.reposition(this._overlayId);
    }

    /**
     * @hidden
     */
    public ngOnInit() {
        if (this.navigationService && this.id) {
            this.navigationService.add(this.id, this);
        }
    }

    /**
     * @hidden
     */
    public ngOnDestroy() {
        if (this.navigationService && this.id) {
            this.navigationService.remove(this.id);
        }
        if (!this.collapsed && this._overlayId) {
            this.overlayService.hide(this._overlayId);
        }
        this.unsubscribe();
        this.destroy$.next(true);
        this.destroy$.complete();
    }

    private overlayClosed = () => {
        this._collapsed = true;
        this.cdr.detectChanges();
        delete this._overlayId;
        this.onClosed.emit();
        this.unsubscribe();
    }

    private unsubscribe() {
        this.clearSubscription(this._overlayOpenedSub);
        this.clearSubscription(this._overlayClosingSub);
        this.clearSubscription(this._overlayClosedSub);
    }

    private clearSubscription(subscription: Subscription) {
        if (subscription && !subscription.closed) {
            subscription.unsubscribe();
        }
    }
}

@Directive({
    exportAs: 'toggle-action',
    selector: '[igxToggleAction]'
})
export class IgxToggleActionDirective implements OnInit {
    protected _overlayDefaults: OverlaySettings;

    /**
     * Provide settings that control the toggle overlay positioning, interaction and scroll behavior.
     * ```typescript
     * const settings: OverlaySettings = {
     *      closeOnOutsideClick: false,
     *      modal: false
     *  }
     * ```
     * ---
     * ```html
     * <!--set-->
     * <div igxToggleAction [overlaySettings]="settings"></div>
     * ```
     */
    @Input()
    public overlaySettings: OverlaySettings;

    private _closeOnOutsideClick: boolean;
    /**
     * DEPRECATED. Determines whether the toggle should close when you click outside.
     *
     * ```typescript
     * // get
     * let closesOnOutsideClick = this.toggle.closeOnOutsideClick;
     * ```
     */
    @Input()
    @DeprecateProperty(`igxToggleAction 'closeOnOutsideClick' input is deprecated. Use 'overlaySettings' input object instead.`)
    public get closeOnOutsideClick(): boolean {
        return this._closeOnOutsideClick;
    }
    /**
     * ```html
     * <!--set-->
     * <div igxToggleAction [closeOnOutsideClick]="'true'"></div>
     * ```
     */
    public set closeOnOutsideClick(v: boolean) {
        this._closeOnOutsideClick = v;
    }

    /**
     * Determines where the toggle element overlay should be attached.
     *
     * ```html
     * <!--set-->
     * <div igxToggleAction [igxToggleOutlet]="outlet"></div>
     * ```
     * Where `outlet` in an instance of `IgxOverlayOutletDirective` or an `ElementRef`
     */
    @Input('igxToggleOutlet')
    public outlet: IgxOverlayOutletDirective | ElementRef;

    /**
     * @hidden
     */
    @Input('igxToggleAction')
    set target(target: any) {
        if (target !== null && target !== '') {
            this._target = target;
        }
    }

    /**
     * @hidden
     */
    get target(): any {
        if (typeof this._target === 'string') {
            return this.navigationService.get(this._target);
        }
        return this._target;
    }

    protected _target: IToggleView | string;

    constructor(private element: ElementRef, @Optional() private navigationService: IgxNavigationService) { }

    /**
     * @hidden
     */
    public ngOnInit() {
        this._overlayDefaults = {
            positionStrategy: new ConnectedPositioningStrategy({ target: this.element.nativeElement }),
            scrollStrategy: new AbsoluteScrollStrategy(),
            closeOnOutsideClick: true,
            modal: false,
            excludePositionTarget: true
        };
    }

    /**
     * @hidden
     */
    @HostListener('click')
    public onClick() {
        if (this._closeOnOutsideClick !== undefined) {
            this._overlayDefaults.closeOnOutsideClick = this._closeOnOutsideClick;
        }
        if (this.outlet) {
            this._overlayDefaults.outlet = this.outlet;
        }

        const clonedSettings = Object.assign({}, this._overlayDefaults, this.overlaySettings);
        this.updateOverlaySettings(clonedSettings);
        this.target.toggle(clonedSettings);
    }

    /**
     * Updates provided overlay settings
     * @param settings settings to update
     * @returns returns updated copy of provided overlay settings
     */
    protected updateOverlaySettings(settings: OverlaySettings): OverlaySettings {
        if (settings && settings.positionStrategy) {
            const positionStrategyClone: IPositionStrategy = settings.positionStrategy.clone();
            positionStrategyClone.settings.target = this.element.nativeElement;
            settings.positionStrategy = positionStrategyClone;
        }

        return settings;
    }
}

/**
 * Mark an element as an igxOverlay outlet container.
 * Directive instance is exported as `overlay-outlet` to be assigned to templates variables:
 * ```html
 * <div igxOverlayOutlet #outlet="overlay-outlet"></div>
 * ```
 */
@Directive({
    exportAs: 'overlay-outlet',
    selector: '[igxOverlayOutlet]'
})
export class IgxOverlayOutletDirective {
    constructor(public element: ElementRef) { }

    /** @hidden */
    public get nativeElement() {
        return this.element.nativeElement;
    }
}

/**
 * @hidden
 */
@NgModule({
    declarations: [IgxToggleDirective, IgxToggleActionDirective, IgxOverlayOutletDirective],
    exports: [IgxToggleDirective, IgxToggleActionDirective, IgxOverlayOutletDirective],
    providers: [IgxNavigationService, Overlay]
})
export class IgxToggleModule { }
