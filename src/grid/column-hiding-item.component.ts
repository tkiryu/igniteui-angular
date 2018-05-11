import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter,
  forwardRef, Inject, Input, OnInit, Output } from "@angular/core";
import { IgxColumnHidingComponent } from "./column-hiding.component";
import { IgxColumnComponent } from "./column.component";

// @Component({
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   selector: "igx-column-chooser-item",
//   templateUrl: "./column-chooser-item.component.html",
// //   styleUrls: ["column-chooser-item.component.css"],
//   providers: [ IgxColumnComponent ]
// })
// export class ColumnChooserItemComponent implements AfterContentInit {
//   private _column: IgxColumnComponent;
//   private _isHidden = false;
//   private _allowHiding = true;
//   // private _columnGroup;
//   // private _isColumnGroup;
//   // private _isParentGroupHidden = false;

//   constructor(
//     @Inject(forwardRef(() => IgxColumnHidingComponent))
//     public columnChooser: IgxColumnHidingComponent,
//     column: IgxColumnComponent,
//     private cdr: ChangeDetectorRef) {
//       this._column = column;
//       // this._isHidden = column.hidden ? column.hidden : false;
//       // this._allowHiding = column.allowHiding;
//   }

//   get isHidden() {
//     return this._isHidden;
//   }

//   @Input()
//   set isHidden(value) {
//     this.onColumnVisibilityChanged(value);
//   }

//   @Output()
//   public onVisibilityChanged = new EventEmitter<IColumnVisibilityChangedEventArgs>();

//   ngAfterContentInit() {
//     this.cdr.markForCheck();
//   }
//   get name() {
//     return (this._column.header) ? this._column.header : this._column.field;
//   }

//   get allowHiding() {
//     return this._column.allowHiding;
//   }

//   public onColumnVisibilityChanged(value) {
//     if (value !== this._column.hidden) {
//       this._isHidden = value;
//       this.onVisibilityChanged.emit({ column: this._column, newValue: this._isHidden });
//     }
//   }
// }

export interface IValueChangedEventArgs {
  oldValue: any;
  newValue: any;
}

export abstract class ItemPropertyValueChanged {
  constructor(private object: any, private propName: string) {
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
  protected _column: IgxColumnComponent;

  constructor(column: IgxColumnComponent, propName: string) {
    super(column, propName);
    this._column = column;
  }

  get name() {
    return (this._column.header) ? this._column.header : this._column.field;
  }
}

export interface IColumnVisibilityChangedEventArgs {
  column: IgxColumnComponent;
  newValue: boolean;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "igx-column-hiding-item",
  templateUrl: "./column-hiding-item.component.html",
//   styleUrls: ["column-hiding-item.component.css"],
  providers: [ IgxColumnComponent ]
})
export class IgxColumnHidingItemComponent extends ColumnItemComponentBase {

  @Output()
  onVisibilityChanged = new EventEmitter<IColumnVisibilityChangedEventArgs>();

  constructor(
    @Inject(forwardRef(() => IgxColumnHidingComponent))
    public columnChooser: IgxColumnHidingComponent,
    public column: IgxColumnComponent) {
      super(column, "hidden");
  }

  get allowHiding() {
    return this.column.allowHiding;
  }
}
