import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter,
  forwardRef, Inject, Input, OnInit, Output, Directive } from "@angular/core";
import { IgxColumnHidingComponent } from "./column-hiding.component";
import { IgxColumnComponent } from "./column.component";
import { Direction } from "../main";

export interface IValueChangedEventArgs {
  oldValue: any;
  newValue: any;
}

export abstract class ItemPropertyValueChanged {
  @Input()
  public object: any;

  constructor(private propName: string) {
  }

  get value() {
    return this.object[this.propName];
  }

  @Input()
  set value(value) {
    this.onValueChanged(value);
  }

  @Output()
  public valueChanged = new EventEmitter<IValueChangedEventArgs>();

  protected onValueChanged(value) {
    const currentValue = this.value;
    if (value !== this.value) {
      this.object[this.propName] = value;
      this.valueChanged.emit({ oldValue: currentValue, newValue: value });
    }
  }
}

export class ColumnItemComponentBase extends ItemPropertyValueChanged {

  @Input()
  public column: any;

  protected _column: IgxColumnComponent;

  constructor(propName: string) {
    super(propName);
    this._column = this.object;
  }

  get name() {
    return (this._column) ? ((this._column.header) ? this._column.header : this._column.field) : "";
  }
}

export interface IColumnVisibilityChangedEventArgs { // check output namings
  column: any;
  newValue: boolean;
}

// @Component({
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   selector: "igx-column-hiding-item",
//   templateUrl: "./column-hiding-item.component.html"
// //   styleUrls: ["column-hiding-item.component.css"]
// })
// export class IgxColumnHidingItemComponent extends ColumnItemComponentBase {
@Directive({
    selector: "[igxColumnHidingItem]"
})
export class IgxColumnHidingItemDirective extends ColumnItemComponentBase {
  @Input()
  public column: any;

  @Output()
  onVisibilityChanged = new EventEmitter<IColumnVisibilityChangedEventArgs>();

  constructor(
    @Inject(forwardRef(() => IgxColumnHidingComponent))
    public columnChooser: IgxColumnHidingComponent) {
      super("hidden");
      this._column = this.column;
  }

  get disableHiding() {
    return this.column.disableHiding;
  }
}
