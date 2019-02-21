import { Injectable, EventEmitter } from '@angular/core';
import { IGridEditEventArgs } from '../grids/grid-base.component';


export interface GridSelectionRange {
    rowStart: number;
    rowEnd: number;
    columnStart: string | number;
    columnEnd: string | number;
}

export interface ISelectionNode {
    row: number;
    column: number;
}

interface ISelectionKeyboardState {
    node: null | ISelectionNode;
    shift: boolean;
    range: GridSelectionRange;
    active: boolean;
}

interface ISelectionPointerState extends ISelectionKeyboardState {
    ctrl: boolean;
}

type SelectionState = ISelectionKeyboardState | ISelectionPointerState;


// TODO: Refactor - export in a separate file

export class IgxRow {
    transactionState: any;
    state: any;
    newData: any;

    constructor(public id: any, public index: number, public data: any) {}

    createEditEventArgs(): IGridEditEventArgs {
        return {
            rowID: this.id,
            oldValue: { ... this.data },
            newValue: this.newData,
            cancel: false
        };
    }
}

export class IgxCell {

    primaryKey: any;
    state: any;

    constructor(
        public id,
        public rowIndex: number,
        public column,
        public value: any,
        public editValue: any,
        public rowData: any) {}

    castToNumber(): void {
        if (this.column.dataType === 'number' && !this.column.inlineEditorTemplate) {
            const v = parseFloat(this.editValue);
            this.editValue = !isNaN(v) && isFinite(v) ? v : 0;
        }
    }

    createEditEventArgs(): IGridEditEventArgs {
        return {
            rowID: this.id.rowID,
            cellID: this.id,
            oldValue: this.value,
            newValue: this.editValue,
            cancel: false
        };
    }
}

@Injectable()
export class IgxGridCRUDService {

    grid;
    cell: IgxCell | null = null;
    row: IgxRow | null = null;

    createCell(cell): IgxCell {
        return new IgxCell(cell.cellID, cell.rowIndex, cell.column, cell.value, cell.value, cell.row.rowData);
    }

    createRow(cell: IgxCell): IgxRow {
        return new IgxRow(cell.id.rowID, cell.rowIndex, cell.rowData);
    }

    sameRow(rowID): boolean {
        return this.row.id === rowID;
    }

    sameCell(cell: IgxCell): boolean {
        return (this.cell.id.rowID === cell.id.rowID &&
            this.cell.id.columnID === cell.id.columnID);
    }

    get inEditMode(): boolean {
        return !!this.cell;
    }

    get rowEditing(): boolean {
        return this.grid.rowEditable;
    }

    get primaryKey(): any {
        return this.grid.primaryKey;
    }

    beginRowEdit() {
        this.row = this.createRow(this.cell);
        const args = {
            rowID: this.row.id,
            oldValue: this.row.data,
            cancel: false
        };
        this.grid.onRowEditEnter.emit(args);
        if (args.cancel) {
            this.endRowEdit();
            return;
        }
        this.row.transactionState = this.grid.transactions.getAggregatedValue(this.row.id, true);
        this.grid.transactions.startPending();
        this.grid.openRowOverlay(this.row.id);
    }


    endRowEdit() {
        this.row = null;
    }

    begin(cell): void {
        this.cell = this.createCell(cell);
        this.cell.primaryKey = this.primaryKey;
        const args = {
            cellID: this.cell.id,
            rowID: this.cell.id.rowID,
            oldValue: this.cell.value,
            cancel: false
        };

        this.grid.onCellEditEnter.emit(args);

        if (args.cancel) {
            this.end();
            return;
        }


        if (this.rowEditing) {
            if (!this.row) {
                this.beginRowEdit();
                return;
            }

            if (this.row && !this.sameRow(this.cell.id.rowID)) {
                this.grid.endEdit(true);
                this.cell = this.createCell(cell);
                this.beginRowEdit();
                return;
            }
        }
    }

    end(): void {
        this.cell = null;
    }


    isInEditMode(rowIndex: number, columnIndex: number): boolean {
        if (!this.cell) {
            return false;
        }
        return this.cell.column.index === columnIndex && this.cell.rowIndex === rowIndex;
    }
}


@Injectable()
export class IgxGridSelectionService {

    dragMode = false;
    activeElement: ISelectionNode | null;
    keyboardState = {} as ISelectionKeyboardState;
    pointerState = {} as ISelectionPointerState;


    selection = new Map<number, Set<number>>();
    _ranges: Set<string> = new Set<string>();


    /**
     * Returns the current selected ranges in the grid from both
     * keyboard and pointer interactions
     */
    get ranges(): GridSelectionRange[] {

        // The last action was keyboard + shift selection -> add it
        if (this.keyboardState.range) {
            this._ranges.add(JSON.stringify(this.keyboardState.range));
        }

        const ranges = Array.from(this._ranges).map(range => JSON.parse(range));

        // No ranges but we have a focused cell -> add it
        if (!ranges.length && this.activeElement) {
            ranges.push(this.generateRange(this.activeElement));
        }

        return ranges;
    }

    constructor() {
        this.initPointerState();
        this.initKeyboardState();
    }

    /**
     * Resets the keyboard state
     */
    initKeyboardState(): void {
        this.keyboardState.node = null;
        this.keyboardState.shift = false;
        this.keyboardState.range = null;
        this.keyboardState.active = false;
    }

    /**
     * Resets the pointer state
     */
    initPointerState(): void {
        this.pointerState.node = null;
        this.pointerState.ctrl = false;
        this.pointerState.shift = false;
        this.pointerState.range = null;
    }

    /**
     * Adds a single node.
     * Single clicks | Ctrl + single clicks on cells is the usual case.
     */
    add(node: ISelectionNode): void {
        this.selection.has(node.row) ? this.selection.get(node.row).add(node.column) :
            this.selection.set(node.row, new Set<number>()).get(node.row).add(node.column);

        this._ranges.add(JSON.stringify({
            rowStart: node.row,
            rowEnd: node.row,
            columnStart: node.column,
            columnEnd: node.column
        }));
    }

    selected(node: ISelectionNode): boolean {
        return this.isActiveNode(node) || (this.selection.has(node.row) && this.selection.get(node.row).has(node.column));
    }

    isActiveNode(node: ISelectionNode): boolean {
        if (this.activeElement) {
            return this.activeElement.column === node.column && this.activeElement.row === node.row;
        }
        return false;
    }

    addRangeMeta(node: ISelectionNode, state: SelectionState) {
        const { rowStart, rowEnd, columnStart, columnEnd } = this.generateRange(node, state);

        this._ranges.add(JSON.stringify({
            rowStart,
            rowEnd,
            columnStart,
            columnEnd
        }));
    }

    /**
     * Generates a new selection range from the given `node`.
     * If a `state` is passed instead it will generate it
     */
    generateRange(node: ISelectionNode, state?: SelectionState): GridSelectionRange {
        if (!state) {
            return {
                rowStart: node.row,
                rowEnd: node.row,
                columnStart: node.column,
                columnEnd: node.column
            };
        }

        const { row, column } = state.node;
        const rowStart = Math.min(node.row, row);
        const rowEnd = Math.max(node.row, row);
        const columnStart = Math.min(node.column, column);
        const columnEnd = Math.max(node.column, column);

        return { rowStart, rowEnd, columnStart, columnEnd };
    }

    /**
     *
     */
    keyboardStateOnKeydown(node: ISelectionNode, shift: boolean, shiftTab: boolean) {
        this.keyboardState.active = true;
        this.initPointerState();
        this.keyboardState.shift = shift && !shiftTab;

        // Kb navigation with shift and no previous node.
        // Clear the current selection init the start node.
        if (this.keyboardState.shift && !this.keyboardState.node) {
            this.clear();
            this.keyboardState.node = node;
        }
    }

    keyboardStateOnFocus(node: ISelectionNode, emitter: EventEmitter<GridSelectionRange>): void {
        const kbState = this.keyboardState;

        // Focus triggered by keyboard navigation
        if (kbState.active) {
            // Start generating a range if shift is hold
            if (kbState.shift) {
                this.dragSelect(node, kbState);
                kbState.range = this.generateRange(node, kbState);
                emitter.emit(this.generateRange(node, kbState));
                return;
            }

            this.initKeyboardState();
            this.clear();
            this.add(node);
        }
    }

    pointerDown(node: ISelectionNode, shift: boolean, ctrl: boolean): void {
        this.initKeyboardState();
        this.pointerState.ctrl = ctrl;
        this.pointerState.shift = shift;

        // No ctrl key pressed - no multiple selection
        if (!ctrl) {
            this.clear();
        }

        if (shift) {
            if (!this.pointerState.node) {
                this.pointerState.node = node;
            }
            this.pointerDownShiftKey(node);
            this.clearTextSelection();
            return;
        }

        this.pointerState.node = node;
    }

    pointerDownShiftKey(node: ISelectionNode): void {
        this.clear();
        this.selectRange(node, this.pointerState);
    }

    pointerEnter(node: ISelectionNode, dragEnabled: boolean): void {
        this.dragMode = dragEnabled;
        if (!this.dragMode) {
            return;
        }
        this.clearTextSelection();
        this.dragSelect(node, this.pointerState);
    }

    pointerUp(node: ISelectionNode, emitter: EventEmitter<GridSelectionRange>): void {
        if (this.dragMode) {
            emitter.emit(this.generateRange(node, this.pointerState));
            this.addRangeMeta(node, this.pointerState);
            this.dragMode = false;
            return;
        }

        if (this.pointerState.shift) {
            this.clearTextSelection();
            emitter.emit(this.generateRange(node, this.pointerState));
            this.addRangeMeta(node, this.pointerState);
            return;
        }

        this.add(node);
    }

    selectRange(node: ISelectionNode, state: SelectionState) {
        const { rowStart, rowEnd, columnStart, columnEnd } = this.generateRange(node, state);
        for (let i = rowStart; i <= rowEnd; i++) {
            for (let j = columnStart as number; j <= columnEnd; j++) {
                this.selection.has(i) ? this.selection.get(i).add(j) :
                    this.selection.set(i, new Set<number>()).get(i).add(j);
            }
        }
    }

    dragSelect(node: ISelectionNode, state: SelectionState): void {
        if (!this.pointerState.ctrl) {
            this.selection.clear();
        }
        this.selectRange(node, state);
    }

    clear(): void {
        this.selection.clear();
        this._ranges.clear();
    }

    clearTextSelection() {
        const selection = window.getSelection();
        if (selection) {
            selection.removeAllRanges();
        }
    }
}
