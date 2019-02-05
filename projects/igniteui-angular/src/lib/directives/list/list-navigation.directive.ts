import { Directive, Optional, Self, Input, HostListener, Inject, OnInit } from '@angular/core';
import { IgxListComponent, IListItemClickEventArgs } from '../../list/list.component';
import { KEYS } from '../../core/utils';
import { IgxListBase } from '../../list/list.common';

/**
 * Navigation Directive that handles keyboard events on its host and controls a targeted IgxListComponent
 */
@Directive({
    selector: '[igxListNavigation]'
})
export class IgxListNavigationDirective implements OnInit {

    // TODO: circular dependency probably caused by importing the directive in the list component file
    protected _target: IgxListComponent = null;
    private _selectedItemIndex: number = -1;

    constructor(@Self() @Optional() @Inject(IgxListBase) public list: IgxListComponent) { }

    // TODO: do we need this property?
    /**
     * Gets the target of the navigation directive;
     *
     * ```typescript
     * // Get
     * export class MyComponent {
     *  ...
     *  @ContentChild(IgxListNavigationDirective)
     *  navDirective: IgxListNavigationDirective = null;
     *  ...
     *  const target: IgxListComponent = navDirective.target;
     * }
     * ```
     */
    get target(): IgxListComponent {
        return this._target;
    }

    /**
     * Sets the target of the navigation directive;
     * If no valid target is passed, it falls back to the list context
     *
     * ```html
     * <!-- Set -->
     * ...
     * <igx-list igxListNavigation>
     * ...
     * </igx-list>
     * ```
     */
    @Input('igxListNavigation')
    set target(target: IgxListComponent) {
        this._target = target ? target : this.list;
    }

    ngOnInit(): void {
        this.target.onItemClicked.subscribe((evt: IListItemClickEventArgs) => {
            console.log('clicked');

            if (this._selectedItemIndex !== -1) {
                this.target.items[this._selectedItemIndex].element.tabIndex = -1;
                // TODO: remove styling
            }

            if (evt.item) {
                this._selectedItemIndex = evt.item.index;
                // TODO: apply styling on the selected item
                evt.item.element.tabIndex = 0;
            }
        });
    }

    /**
     * Captures keydown events and calls the appropriate handlers on the target component
     */
    @HostListener('keydown', ['$event'])
    handleKeyDown(event: KeyboardEvent) {
        if (event) {
            const key = event.key as KEYS;
            console.log('key pressed: ' + event.key);

            switch (key) {
                case KEYS.ENTER:
                case KEYS.SPACE:
                case KEYS.SPACE_IE:
                    this.onSelectionKeyDown(event);

                    this.stopEventPropagation(event);
                    break;
                case KEYS.UP_ARROW:
                case KEYS.UP_ARROW_IE:
                    this.onArrowUpKeyDown();

                    this.stopEventPropagation(event);
                    break;
                case KEYS.DOWN_ARROW:
                case KEYS.DOWN_ARROW_IE:
                    this.onArrowDownKeyDown();

                    this.stopEventPropagation(event);
                    break;
                case KEYS.HOME:
                    this.onHomeKeyDown();

                    this.stopEventPropagation(event);
                    break;
                case KEYS.END:
                    this.onEndKeyDown();

                    this.stopEventPropagation(event);
                    break;
            }
        }
    }

    private stopEventPropagation(event: KeyboardEvent) {
        event.preventDefault();
        event.stopPropagation();
    }

    /**
     * Select
     */
    private onSelectionKeyDown(event: KeyboardEvent) {
        if (this._selectedItemIndex !== -1) {
            const selectedItem = this.target.items[this._selectedItemIndex];
            if (selectedItem) {
                selectedItem.clicked(event);
            }
        }
    }

    /**
     * Navigates to next item
     */
    private onArrowDownKeyDown() {
        //this.target.navigateNext();
    }

    /**
     * Navigates to previous item
     */
    private onArrowUpKeyDown() {
        //this.target.navigatePrev();
    }

    /**
     * Navigates to target's last item
     */
    private onEndKeyDown() {
        //this.target.navigateLast();
    }

    /**
     * Navigates to target's first item
     */
    private onHomeKeyDown() {
        //this.target.navigateFirst();
    }
}
