import { Component, Input, Output, EventEmitter, HostBinding, ElementRef, HostListener } from '@angular/core';
import { ICalendarDate, isDateInRanges, Calendar } from '../calendar';
import { DateRangeDescriptor, DateRangeType } from '../../core/dates';
import { CalendarSelection } from '../calendar-base';

/**
 *@hidden
*/
@Component({
    selector: 'igx-day-item',
    templateUrl: 'day-item.component.html'
})
export class IgxDayItemComponent {
    @Input()
    public date: ICalendarDate;

    @Input()
    public selection: string;

    @Input()
    public value: Date | Date[];

    @Input()
    public disabledDates: DateRangeDescriptor[];

    @Input()
    public outOfRangeDates: DateRangeDescriptor[];

    @Input()
    public specialDates: DateRangeDescriptor[];

    @Output()
    public onDateSelection = new EventEmitter<ICalendarDate>();

    public get selected(): boolean {
        const date = this.date.date;

        if (!this.value) {
            return;
        }

        if (this.selection === CalendarSelection.SINGLE) {
            this._selected = (this.value as Date).getTime() === date.getTime();
        } else {
            const selectedDates = (this.value as Date[]);
            const currentDate = selectedDates.find(element => element.getTime() === date.getTime());

            this._index = selectedDates.indexOf(currentDate) + 1;
            this._selected = !!this._index;
        }

        return this._selected;
    }

    public set selected(value: boolean) {
        this._selected = value;
    }

    public get isCurrentMonth(): boolean {
        return this.date.isCurrentMonth;
    }

    public get isPreviousMonth(): boolean {
        return this.date.isPrevMonth;
    }

    public get isNextMonth(): boolean {
        return this.date.isNextMonth;
    }

    public get nativeElement() {
        return this.elementRef.nativeElement;
    }

    public get isInactive(): boolean {
        return this.date.isNextMonth || this.date.isPrevMonth;
    }

    public get isToday(): boolean {
        const today = new Date(Date.now());
        const date = this.date.date;
        return (date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            date.getDate() === today.getDate()
        );
    }

    public get isWeekend(): boolean {
        const day = this.date.date.getDay();
        return day === 0 || day === 6;
    }

    public get isDisabled(): boolean {
        if (this.disabledDates === null) {
            return false;
        }

        return isDateInRanges(this.date.date, this.disabledDates);
    }

    public get isOutOfRange(): boolean {
        if (!this.outOfRangeDates) {
            return false;
        }

        return isDateInRanges(this.date.date, this.outOfRangeDates);
    }

    public get isSpecial(): boolean {
        if (this.specialDates === null) {
            return false;
        }

        return isDateInRanges(this.date.date, this.specialDates);
    }

    @HostBinding('attr.tabindex')
    public tabindex = 0;

    @HostBinding('class.igx-calendar__date')
    public get defaultCSS(): boolean {
        return this.date.isCurrentMonth && !(this.isWeekend && this.selected);
    }

    @HostBinding('class.igx-calendar__date--inactive')
    public get isInactiveCSS(): boolean {
        return this.isInactive;
    }

    @HostBinding('class.igx-calendar__date--current')
    public get isTodayCSS(): boolean {
        return this.isToday;
    }

    @HostBinding('class.igx-calendar__date--selected')
    public get isSelectedCSS(): boolean {
        return this.selected;
    }

    @HostBinding('class.igx-calendar__date--weekend')
    public get isWeekendCSS(): boolean {
        return this.isWeekend;
    }

    @HostBinding('class.igx-calendar__date--disabled')
    public get isDisabledCSS(): boolean {
        return this.isDisabled || this.isOutOfRange;
    }

    @HostBinding('class.igx-calendar__date--range')
    public get isWithinRange() {
        if (Array.isArray(this.value) && this.value.length > 1) {

            return isDateInRanges(this.date.date,
                [
                    {
                        type: DateRangeType.Between,
                        dateRange: [this.value[0], this.value[this.value.length - 1]]
                    }
                ]
            );
        }

        return false;
    }

    @HostBinding('class.igx-calendar__date--special')
    public get isSpecialCSS(): boolean {
        return this.isSpecial;
    }

    @HostBinding('class.igx-calendar__date--single')
    public get isSingleSelection(): boolean {
        return this.selection !== CalendarSelection.RANGE;
    }

    @HostBinding('class.igx-calendar__date--first')
    public get isFirstInRange(): boolean {
        if (this.isSingleSelection) {
            return false;
        }

        return this._index === 1;
    }

    @HostBinding('class.igx-calendar__date--last')
    public get isLastInRange(): boolean {
        if (this.isSingleSelection) {
            return false;
        }

        return (this.value as Date[]).length === this._index;
    }

    private _index: Number;
    private _selected = false;

    constructor(private elementRef: ElementRef) { }

    @HostListener('click')
    @HostListener('keydown.enter')
    public onSelect() {
        this.onDateSelection.emit(this.date);
    }
}
