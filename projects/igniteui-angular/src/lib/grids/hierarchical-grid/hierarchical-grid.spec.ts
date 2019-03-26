import { configureTestSuite } from '../../test-utils/configure-suite';
import { async, TestBed, fakeAsync, tick, ComponentFixture } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { IgxHierarchicalGridModule } from './index';
import { ChangeDetectorRef, Component, ViewChild, TemplateRef, AfterViewInit } from '@angular/core';
import { IgxHierarchicalGridComponent } from './hierarchical-grid.component';
import { wait, UIInteractions } from '../../test-utils/ui-interactions.spec';
import { IgxRowIslandComponent } from './row-island.component';
import { IgxHierarchicalRowComponent } from './hierarchical-row.component';
import { By } from '@angular/platform-browser';
import { IgxChildGridRowComponent } from './child-grid-row.component';
import { DisplayDensity } from '../../core/displayDensity';

describe('Basic IgxHierarchicalGrid', () => {
    configureTestSuite();
    let fixture;
    let hierarchicalGrid: IgxHierarchicalGridComponent;
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                IgxHierarchicalGridTestBaseComponent
            ],
            imports: [
                NoopAnimationsModule, IgxHierarchicalGridModule]
        }).compileComponents();
    }));

    beforeEach(async(() => {
        fixture = TestBed.createComponent(IgxHierarchicalGridTestBaseComponent);
        fixture.detectChanges();
        hierarchicalGrid = fixture.componentInstance.hgrid;
    }));

    it('should render expansion indicator as the first element of each expandable row.', () => {
        fixture.componentInstance.data = [
            {ID: 0, ProductName: 'Product: A0'},
            {ID: 1, ProductName: 'Product: A1', childData: fixture.componentInstance.generateDataUneven(1, 1)},
            {ID: 2, ProductName: 'Product: A2', childData: fixture.componentInstance.generateDataUneven(1, 1)}
        ];
        fixture.detectChanges();
        const row1 = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        expect(row1.hasChildren).toBe(true);
        const rowElems = fixture.debugElement.queryAll(By.directive(IgxHierarchicalRowComponent));
        expect(rowElems[0].query(By.css('igx-icon')).nativeElement.innerText).toEqual('expand_more');
        const row2 = hierarchicalGrid.getRowByIndex(1) as IgxHierarchicalRowComponent;
        expect(row2.hasChildren).toBe(true);
        expect(rowElems[1].query(By.css('igx-icon')).nativeElement.innerText).toEqual('expand_more');

        const row3 = hierarchicalGrid.getRowByIndex(1) as IgxHierarchicalRowComponent;
        expect(row3.hasChildren).toBe(true);
        expect(rowElems[2].query(By.css('igx-icon')).nativeElement.innerText).toEqual('expand_more');
    });

    it('should allow expand/collapse rows through the UI', () => {
        const row1 = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        expect(row1.expanded).toBe(false);
        UIInteractions.clickElement(row1.expander);
        fixture.detectChanges();
        expect(row1.expanded).toBe(true);
        expect(hierarchicalGrid.hgridAPI.getChildGrids(false).length).toBe(1);
        expect(hierarchicalGrid.getRowByIndex(1) instanceof IgxChildGridRowComponent).toBe(true);
        UIInteractions.clickElement(row1.expander);
        fixture.detectChanges();
        expect(row1.expanded).toBe(false);
        expect(hierarchicalGrid.getRowByIndex(1) instanceof IgxHierarchicalRowComponent).toBe(true);
    });

    it('should change expand/collapse indicators when state of the row changes', () => {
        const row = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        const rowElem = fixture.debugElement.queryAll(By.directive(IgxHierarchicalRowComponent))[0];
        expect(rowElem.query(By.css('igx-icon')).nativeElement.innerText).toEqual('expand_more');
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();

        expect(rowElem.query(By.css('igx-icon')).nativeElement.innerText).toEqual('expand_less');
    });

    it('should collapse all rows that belongs to a grid via header collapse icon', () => {
        const headerExpanderElem = fixture.debugElement.queryAll(By.css('.igx-grid__hierarchical-expander--header'))[0];
        let icon = headerExpanderElem.query(By.css('igx-icon')).componentInstance;
        let iconTxt = headerExpanderElem.query(By.css('igx-icon')).nativeElement.textContent.toLowerCase();
        expect(iconTxt).toBe('unfold_less');
        expect(icon.getActive).toBe(false);
        // expand row
        const row = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();

        icon = headerExpanderElem.query(By.css('igx-icon')).componentInstance;
        iconTxt = headerExpanderElem.query(By.css('igx-icon')).nativeElement.textContent.toLowerCase();
        expect(iconTxt).toBe('unfold_less');
        expect(icon.getActive).toBe(true);
        expect(hierarchicalGrid.hierarchicalState.length).toEqual(1);

        UIInteractions.clickElement(icon.el);
        fixture.detectChanges();
        const rows = hierarchicalGrid.dataRowList.toArray();
        rows.forEach((r) => {
            expect(r.expanded).toBe(false);
        });
        iconTxt = headerExpanderElem.query(By.css('igx-icon')).nativeElement.textContent.toLowerCase();
        expect(iconTxt).toBe('unfold_less');
        expect(icon.getActive).toBe(false);
        expect(hierarchicalGrid.hierarchicalState.length).toEqual(0);
    });
    it('should allow applying initial expansions state for certain rows through hierarchicalState option', () => {
        // set first row as expanded.
        hierarchicalGrid.hierarchicalState = [{rowID: fixture.componentInstance.data[0]}];
        hierarchicalGrid.cdr.detectChanges();
        const row1 = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        // verify row is expanded
        expect(row1.expanded).toBe(true);
        expect(hierarchicalGrid.hgridAPI.getChildGrids(false).length).toBe(1);
        expect(hierarchicalGrid.getRowByIndex(1) instanceof IgxChildGridRowComponent).toBe(true);
    });

    it('should allow defining more than one nested row islands', () => {
        const row = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();

        const childGrid = hierarchicalGrid.hgridAPI.getChildGrids(false)[0];
        const childRow = childGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(childRow.expander);
        fixture.detectChanges();

        // should have 3 level hierarchy
        const allChildren =  hierarchicalGrid.hgridAPI.getChildGrids(true);
        expect(allChildren.length).toBe(2);
        expect(hierarchicalGrid.getRowByIndex(1) instanceof IgxChildGridRowComponent).toBe(true);
        expect(childGrid.getRowByIndex(1) instanceof IgxChildGridRowComponent).toBe(true);
    });

    it('should retain expansion states when scrolling', (async () => {
        const row = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();
        expect(row.expanded).toBe(true);
        // scroll to bottom
        hierarchicalGrid.verticalScrollContainer.scrollTo(hierarchicalGrid.verticalScrollContainer.igxForOf.length - 1);
        await wait(100);
        fixture.detectChanges();
        // scroll to top
        hierarchicalGrid.verticalScrollContainer.scrollTo(0);
        await wait(100);
        fixture.detectChanges();
        expect((hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent).expanded).toBe(true);
    }));

    it('should show header collapse button if grid has data and row island is defined.', () => {
        fixture.componentInstance.data = [
            {ID: 0, ProductName: 'Product: A0'}
        ];
        fixture.detectChanges();
        const headerExpanderElem = fixture.debugElement.queryAll(By.css('.igx-grid__hierarchical-expander--header'))[0];
        const icon = headerExpanderElem.query(By.css('igx-icon'));
        expect(icon).toBeDefined();
    });

    it('should render last cell of rows fully visible when columns does not have width specified and without scrollbar', () => {
        const firstRowCell: HTMLElement = hierarchicalGrid.getRowByIndex(0).cells.last.nativeElement;
        const cellLeftOffset = firstRowCell.offsetLeft + firstRowCell.parentElement.offsetLeft + firstRowCell.offsetWidth;
        const gridWidth = hierarchicalGrid.nativeElement.offsetWidth;
        expect(cellLeftOffset).not.toBeGreaterThan(gridWidth);

        const hScroll = hierarchicalGrid.parentVirtDir.getHorizontalScroll();
        expect(hScroll.children[0].offsetWidth).not.toBeGreaterThan(hScroll.offsetWidth);
    });

    it('should allow extracting child grids using hgridAPI', () => {
        // set first row as expanded.
        hierarchicalGrid.hierarchicalState = [{ rowID: fixture.componentInstance.data[0] }];
        hierarchicalGrid.cdr.detectChanges();
        const row1 = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        // verify row is expanded
        expect(row1.expanded).toBe(true);
        const childGrid = hierarchicalGrid.hgridAPI.getChildGrid(hierarchicalGrid.id,
            [{ rowID: fixture.componentInstance.data[0], rowIslandKey: 'childData' }]);
        expect(childGrid).not.toBeNull();
        childGrid.hierarchicalState = [{ rowID: fixture.componentInstance.data[0].childData[0] }];
        childGrid.cdr.detectChanges();
        const grandChildGrid = hierarchicalGrid.hgridAPI.getChildGrid(hierarchicalGrid.id,
            [{ rowID: fixture.componentInstance.data[0], rowIslandKey: 'childData' },
            { rowID: fixture.componentInstance.data[0].childData[0], rowIslandKey: 'childData' }]
        );
        expect(grandChildGrid).not.toBeNull();

        const rowIsland1 = hierarchicalGrid.hgridAPI.getLayout('igx-row-island-childData');
        const rowIsland2 = hierarchicalGrid.hgridAPI.getLayout('igx-row-island-childData-childData');
        expect(rowIsland1.key).toBe('childData');
        expect(rowIsland2.key).toBe('childData');
    });

    it('should allow setting expandChildren after bound to data', () => {
        // set first row as expanded.
        hierarchicalGrid.hierarchicalState = [{ rowID: fixture.componentInstance.data[0] }];
        hierarchicalGrid.cdr.detectChanges();
        let row1 = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        // verify row is expanded
        expect(row1.expanded).toBe(true);
        hierarchicalGrid.expandChildren = false;
        hierarchicalGrid.cdr.detectChanges();
        row1 = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        expect(row1.expanded).toBe(false);
        const expandIcons = fixture.debugElement.queryAll(By.css('#igx-icon-15'));
        expect(expandIcons.length).toBe(0);
        let rows = hierarchicalGrid.dataRowList.toArray();
        rows.forEach((r) => {
            expect(r.expanded).toBe(false);
        });
        hierarchicalGrid.expandChildren = true;
        hierarchicalGrid.cdr.detectChanges();
        rows = hierarchicalGrid.dataRowList.toArray();
        rows.forEach((r) => {
            expect(r.expanded).toBe(true);
        });

        row1 = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        expect(row1.expanded).toBe(true);
    });

    it('should allow setting expandChildren after bound to data to rowIsland', () => {
        // set first row as expanded.
        hierarchicalGrid.hierarchicalState = [{ rowID: fixture.componentInstance.data[0] }];
        hierarchicalGrid.cdr.detectChanges();
        const row1 = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        // verify row is expanded
        expect(row1.expanded).toBe(true);
        // expand children for the rowIsland should be false by default
        expect(fixture.componentInstance.rowIsland.expandChildren).toBeFalsy();
        fixture.componentInstance.rowIsland.expandChildren = true;
        fixture.detectChanges();
        const childGrid = hierarchicalGrid.hgridAPI.getChildGrid(hierarchicalGrid.id,
            [{ rowID: fixture.componentInstance.data[0], rowIslandKey: 'childData' }]);
        const childRow = childGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        expect(childRow.expanded).toBe(true);
        let rows = childGrid.dataRowList.toArray();
        rows.forEach((r) => {
            expect(r.expanded).toBe(true);
        });
        fixture.componentInstance.rowIsland.expandChildren = false;
        fixture.detectChanges();
        rows = childGrid.dataRowList.toArray();
        rows.forEach((r) => {
            expect(r.expanded).toBe(false);
        });

    });

    it('should render correctly when display density is changed', fakeAsync(() => {
        const row = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();
        const childGrids =  fixture.debugElement.queryAll(By.css('igx-child-grid-row'));
        const childGrid = childGrids[0].query(By.css('igx-hierarchical-grid')).componentInstance;

        expect(hierarchicalGrid.displayDensity).toEqual(DisplayDensity.comfortable);

        hierarchicalGrid.displayDensity = DisplayDensity.cosy;
        fixture.detectChanges();
        tick(100);

        expect(hierarchicalGrid.nativeElement.classList.contains('igx-grid--cosy')).toBe(true);
        expect(childGrid.displayDensity).toBe(DisplayDensity.cosy);

        hierarchicalGrid.displayDensity = DisplayDensity.compact;
        fixture.detectChanges();
        tick(100);

        expect(hierarchicalGrid.nativeElement.classList.contains('igx-grid--compact')).toBe(true);
        expect(childGrid.displayDensity).toBe(DisplayDensity.compact);
    }));
});

describe('IgxHierarchicalGrid Row Islands', () => {
    configureTestSuite();
    let fixture;
    let hierarchicalGrid: IgxHierarchicalGridComponent;
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                IgxHierarchicalGridMultiLayoutComponent
            ],
            imports: [
                NoopAnimationsModule, IgxHierarchicalGridModule]
        }).compileComponents();
    }));

    beforeEach(async(() => {
        fixture = TestBed.createComponent(IgxHierarchicalGridMultiLayoutComponent);
        fixture.detectChanges();
        hierarchicalGrid = fixture.componentInstance.hgrid;
    }));

    it('should allow defining row islands on the same level', () => {
        const row = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();
        const childGrids = hierarchicalGrid.hgridAPI.getChildGrids(false);
        const childRows = fixture.debugElement.queryAll(By.directive(IgxChildGridRowComponent));
        expect(childGrids.length).toBe(2);
        expect(childRows.length).toBe(2);
        const ri1 = fixture.componentInstance.rowIsland1;
        const ri2 = fixture.componentInstance.rowIsland2;
        expect(childRows[0].componentInstance.layout).toBe(ri1);
        expect(childRows[1].componentInstance.layout).toBe(ri2);
    });

    it('should display correct data for sibling row islands', () => {
        const uniqueData = [
            {
                ID: 1,
                ProductName : 'Parent Name',
                childData: [
                    {
                        ID: 11,
                        ProductName : 'Child1 Name'
                    }
                ],
                childData2: [
                    {
                        ID: 12,
                        Col1: 'Child2 Col1',
                        Col2: 'Child2 Col2',
                        Col3: 'Child2 Col3'
                    }
                ]
            }
        ];

        fixture.componentInstance.data = uniqueData;
        fixture.detectChanges();

        const row = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();
        const childGrids = hierarchicalGrid.hgridAPI.getChildGrids(false);

        // check if data for each is correct
        const child1 = childGrids[0];
        const child2 = childGrids[1];

        expect(child1.data).toBe(fixture.componentInstance.data[0].childData);
        expect(child2.data).toBe(fixture.componentInstance.data[0].childData2);

        expect(child1.getCellByColumn(0, 'ID').value).toBe(11);
        expect(child1.getCellByColumn(0, 'ProductName').value).toBe('Child1 Name');

        expect(child2.getCellByColumn(0, 'Col1').value).toBe('Child2 Col1');
        expect(child2.getCellByColumn(0, 'Col2').value).toBe('Child2 Col2');
        expect(child2.getCellByColumn(0, 'Col3').value).toBe('Child2 Col3');

    });

    it('should apply the set options on the row island to all of its related child grids.', () => {
        fixture.componentInstance.height = '200px';
        fixture.detectChanges();
        const row = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();
        const childGrids = hierarchicalGrid.hgridAPI.getChildGrids(false);
        expect(childGrids[0].height).toBe('200px');
        expect(childGrids[1].height).toBe('200px');
    });

    it('Should apply runtime option changes to all related child grids (both existing and not yet initialized).', () => {
        const row = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();
        const ri1 = fixture.componentInstance.rowIsland1;
        ri1.rowSelectable = true;
        fixture.detectChanges();

        // check rendered grid
        let childGrids = hierarchicalGrid.hgridAPI.getChildGrids(false);
        expect(childGrids[0].rowSelectable).toBe(true);
        expect(childGrids[1].rowSelectable).toBe(false);

        // expand new row and check newly generated grid
        const row2 = hierarchicalGrid.getRowByIndex(3) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row2.expander);
        fixture.detectChanges();
        childGrids = hierarchicalGrid.hgridAPI.getChildGrids(false);
        expect(childGrids[0].rowSelectable).toBe(true);
        expect(childGrids[1].rowSelectable).toBe(true);
        expect(childGrids[2].rowSelectable).toBe(false);
        expect(childGrids[3].rowSelectable).toBe(false);
    });
    it('should apply column settings applied to the row island to all related child grids.', () => {
        const row = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();

        const ri1 = fixture.componentInstance.rowIsland1;
        const ri2 = fixture.componentInstance.rowIsland2;

        const childGrids = hierarchicalGrid.hgridAPI.getChildGrids(false);

        const child1Cols = childGrids[0].columnList.toArray();
        const riCols = ri1.columnList.toArray();
        expect(child1Cols.length).toEqual(riCols.length);
        for (let i = 0; i < riCols.length; i++) {
            const col = child1Cols.find((c) => c.key === riCols[i].key);
            expect(col).not.toBeNull();
        }
        const child2Cols = childGrids[1].columnList.toArray();
        const ri2Cols = ri2.columnList.toArray();
        expect(child2Cols.length).toEqual(ri2Cols.length);
        for (let j = 0; j < riCols.length; j++) {
            const col = child2Cols.find((c) => c.key === ri2Cols[j].key);
            expect(col).not.toBeNull();
        }
    });
    it('should allow setting different height/width in px/percent for row islands and grids should be rendered correctly.', () => {
        const ri1 = fixture.componentInstance.rowIsland1;

        // test px
        ri1.height = '200px';
        ri1.width = '200px';

        fixture.detectChanges();

        let row = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();
        let childGrids =  fixture.debugElement.queryAll(By.css('igx-child-grid-row'));
        let childGrid = childGrids[0].query(By.css('igx-hierarchical-grid')).componentInstance;

        // check sizes are applied
        expect(childGrid.width).toBe(ri1.width);
        expect(childGrid.height).toBe(ri1.height);
        expect(childGrid.nativeElement.style.height).toBe(ri1.height);
        expect(childGrid.nativeElement.style.width).toBe(ri1.width);
        // check virtualization state
        expect(childGrid.verticalScrollContainer.state.chunkSize).toBe(4);
        expect(childGrid.verticalScrollContainer.getVerticalScroll().scrollHeight).toBe(350);

        let hVirt = childGrid.getRowByIndex(0).virtDirRow;
        expect(hVirt.state.chunkSize).toBe(2);
        expect(hVirt.getHorizontalScroll().scrollWidth).toBe(272);
        // collapse row
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();
        // test %
        ri1.height = '50%';
        ri1.width = '50%';

        fixture.detectChanges();
        row = hierarchicalGrid.getRowByIndex(1) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();


        childGrids =  fixture.debugElement.queryAll(By.css('igx-child-grid-row'));
        childGrid = childGrids[0].query(By.css('igx-hierarchical-grid')).componentInstance;

         // check sizes are applied
         expect(childGrid.width).toBe(ri1.width);
         expect(childGrid.height).toBe(ri1.height);
         expect(childGrid.nativeElement.style.height).toBe(ri1.height);
         expect(childGrid.nativeElement.style.width).toBe(ri1.width);
         // check virtualization state
         expect(childGrid.verticalScrollContainer.state.chunkSize).toBe(11);
         expect(childGrid.verticalScrollContainer.getVerticalScroll().scrollHeight).toBe(700);
         hVirt = childGrid.getRowByIndex(0).virtDirRow;
         expect(hVirt.getHorizontalScroll().scrollWidth).toBe(272);
    });
});

describe('IgxHierarchicalGrid Remote Scenarios', () => {
    configureTestSuite();
    let fixture: ComponentFixture<IgxHGridRemoteOnDemandComponent>;
    const TBODY_CLASS = '.igx-grid__tbody-content';
    const THEAD_CLASS = '.igx-grid__thead';
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                IgxHGridRemoteOnDemandComponent
            ],
            imports: [
                NoopAnimationsModule, IgxHierarchicalGridModule]
        }).compileComponents();

        fixture = TestBed.createComponent(IgxHGridRemoteOnDemandComponent);
        fixture.detectChanges();
    }));

    it('should render loading indicator when loading and autoGenerate are enabled', fakeAsync(() => {
        fixture.detectChanges();

        const grid = fixture.componentInstance.instance;
        const gridBody = fixture.debugElement.query(By.css(TBODY_CLASS));
        const gridHead = fixture.debugElement.query(By.css(THEAD_CLASS));
        let loadingIndicator = gridBody.query(By.css('.igx-grid__loading'));
        let colHeaders = gridHead.queryAll(By.css('igx-grid-header'));

        expect(loadingIndicator).not.toBeNull();
        expect(colHeaders.length).toBe(0);
        expect(gridBody.nativeElement.textContent).not.toEqual(grid.emptyFilteredGridMessage);

        // Check for loaded rows in grid's container
        grid.shouldGenerate = true;
        fixture.componentInstance.bind();
        fixture.detectChanges();
        tick(1000);

        loadingIndicator = gridBody.query(By.css('.igx-grid__loading'));
        colHeaders = gridHead.queryAll(By.css('igx-grid-header'));
        expect(colHeaders.length).toBeGreaterThan(0);
        expect(loadingIndicator).toBeNull();
    }));

    it('should render disabled collapse all icon for child grid even when it has no data but with child row island', () => {
        const hierarchicalGrid = fixture.componentInstance.instance;

        fixture.componentInstance.bind();
        fixture.detectChanges();

        const row = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();

        const gridHead = fixture.debugElement.queryAll(By.css(THEAD_CLASS))[1];
        const headerExpanderElem = gridHead.queryAll(By.css('.igx-grid__hierarchical-expander--header'))[0];
        const icon = headerExpanderElem.query(By.css('igx-icon')).componentInstance;
        const iconTxt = headerExpanderElem.query(By.css('igx-icon')).nativeElement.textContent.toLowerCase();
        expect(iconTxt).toBe('unfold_less');
        expect(icon.getActive).toBe(false);
    });
});

describe('IgxHierarchicalGrid Template Changing Scenarios', () => {
    configureTestSuite();
    const TBODY_CLASS = '.igx-grid__tbody-content';
    const THEAD_CLASS = '.igx-grid__thead';
    let fixture: ComponentFixture<IgxHierarchicalGridColumnsUpdateComponent>;
    let hierarchicalGrid: IgxHierarchicalGridComponent;
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                IgxHierarchicalGridColumnsUpdateComponent
            ],
            imports: [
                NoopAnimationsModule, IgxHierarchicalGridModule]
        }).compileComponents();

        fixture = TestBed.createComponent(IgxHierarchicalGridColumnsUpdateComponent);
        fixture.detectChanges();
        hierarchicalGrid = fixture.componentInstance.hgrid;
    }));

    it('should render correct columns when setting columns for child in AfterViewInit using ngFor', () => {
        const gridHead = fixture.debugElement.query(By.css(THEAD_CLASS));
        const colHeaders = gridHead.queryAll(By.css('igx-grid-header'));
        expect(colHeaders.length).toEqual(2);
        expect(colHeaders[0].nativeElement.innerText).toEqual('ID');
        expect(colHeaders[1].nativeElement.innerText).toEqual('ProductName');

        const row = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();

        const child1Grids =  fixture.debugElement.queryAll(By.css('igx-child-grid-row'));
        const child1Grid = child1Grids[0].query(By.css('igx-hierarchical-grid'));
        const child1Headers = child1Grid.queryAll(By.css('igx-grid-header'));

        expect(child1Headers.length).toEqual(5);
        expect(child1Headers[0].nativeElement.innerText).toEqual('ID');
        expect(child1Headers[1].nativeElement.innerText).toEqual('ProductName');
        expect(child1Headers[2].nativeElement.innerText).toEqual('Col1');
        expect(child1Headers[3].nativeElement.innerText).toEqual('Col2');
        expect(child1Headers[4].nativeElement.innerText).toEqual('Col3');

        const row1 = child1Grid.componentInstance.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row1.expander);
        fixture.detectChanges();

        const child2Grids =  child1Grid.queryAll(By.css('igx-child-grid-row'));
        const child2Grid = child2Grids[0].query(By.css('igx-hierarchical-grid'));
        const child2Headers = child2Grid.queryAll(By.css('igx-grid-header'));

        expect(child2Headers.length).toEqual(3);
        expect(child2Headers[0].nativeElement.innerText).toEqual('ID');
        expect(child2Headers[1].nativeElement.innerText).toEqual('ProductName');
        expect(child2Headers[2].nativeElement.innerText).toEqual('Col1');
    });

    it('should update columns for expanded child when adding column to row island', () => {
        const row = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();

        const child1Grids =  fixture.debugElement.queryAll(By.css('igx-child-grid-row'));
        const child1Grid = child1Grids[0].query(By.css('igx-hierarchical-grid'));

        const row1 = child1Grid.componentInstance.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row1.expander);
        fixture.detectChanges();

        const child2Grids =  child1Grid.queryAll(By.css('igx-child-grid-row'));
        const child2Grid = child2Grids[0].query(By.css('igx-hierarchical-grid'));
        let child2Headers = child2Grid.queryAll(By.css('igx-grid-header'));

        expect(child2Headers.length).toEqual(3);
        expect(child2Headers[0].nativeElement.innerText).toEqual('ID');
        expect(child2Headers[1].nativeElement.innerText).toEqual('ProductName');
        expect(child2Headers[2].nativeElement.innerText).toEqual('Col1');

        fixture.componentInstance.islandCols2.push('Col2');
        fixture.detectChanges();

        child2Headers = child2Grid.queryAll(By.css('igx-grid-header'));
        expect(child2Headers.length).toEqual(4);
        expect(child2Headers[0].nativeElement.innerText).toEqual('ID');
        expect(child2Headers[1].nativeElement.innerText).toEqual('ProductName');
        expect(child2Headers[2].nativeElement.innerText).toEqual('Col1');
        expect(child2Headers[3].nativeElement.innerText).toEqual('Col2');

        const child1Headers = child1Grid.query(By.css(THEAD_CLASS)).queryAll(By.css('igx-grid-header'));
        expect(child1Headers.length).toEqual(5);
        expect(child1Headers[0].nativeElement.innerText).toEqual('ID');
        expect(child1Headers[1].nativeElement.innerText).toEqual('ProductName');
        expect(child1Headers[2].nativeElement.innerText).toEqual('Col1');
        expect(child1Headers[3].nativeElement.innerText).toEqual('Col2');
        expect(child1Headers[4].nativeElement.innerText).toEqual('Col3');

        const gridHead = fixture.debugElement.query(By.css(THEAD_CLASS));
        const colHeaders = gridHead.queryAll(By.css('igx-grid-header'));
        expect(colHeaders.length).toEqual(2);
        expect(colHeaders[0].nativeElement.innerText).toEqual('ID');
        expect(colHeaders[1].nativeElement.innerText).toEqual('ProductName');
    });

    it('should update columns for rendered child that is collapsed when adding column to row island', () => {
        const row = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();

        const child1Grids =  fixture.debugElement.queryAll(By.css('igx-child-grid-row'));
        const child1Grid = child1Grids[0].query(By.css('igx-hierarchical-grid'));

        const row1 = child1Grid.componentInstance.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row1.expander);
        fixture.detectChanges();

        const child2Grids =  child1Grid.queryAll(By.css('igx-child-grid-row'));
        const child2Grid = child2Grids[0].query(By.css('igx-hierarchical-grid'));
        let child2Headers = child2Grid.queryAll(By.css('igx-grid-header'));

        expect(child2Headers.length).toEqual(3);
        expect(child2Headers[0].nativeElement.innerText).toEqual('ID');
        expect(child2Headers[1].nativeElement.innerText).toEqual('ProductName');
        expect(child2Headers[2].nativeElement.innerText).toEqual('Col1');

        UIInteractions.clickElement(row1.expander);
        fixture.detectChanges();

        fixture.componentInstance.islandCols2.push('Col2');
        fixture.detectChanges();

        UIInteractions.clickElement(row1.expander);
        fixture.detectChanges();

        child2Headers = child2Grid.queryAll(By.css('igx-grid-header'));
        expect(child2Headers.length).toEqual(4);
        expect(child2Headers[0].nativeElement.innerText).toEqual('ID');
        expect(child2Headers[1].nativeElement.innerText).toEqual('ProductName');
        expect(child2Headers[2].nativeElement.innerText).toEqual('Col1');
        expect(child2Headers[3].nativeElement.innerText).toEqual('Col2');
    });
});

@Component({
    template: `
    <igx-hierarchical-grid #grid1 [data]="data"
     [autoGenerate]="false" [height]="'400px'" [width]="'500px'" #hierarchicalGrid>
     <igx-column field="ID"></igx-column>
     <igx-column field="ProductName"></igx-column>
        <igx-row-island [key]="'childData'" [autoGenerate]="false" #rowIsland>
            <igx-column field="ID"></igx-column>
            <igx-column field="ProductName"></igx-column>
            <igx-column field="Col1"></igx-column>
            <igx-column field="Col2"></igx-column>
            <igx-column field="Col3"></igx-column>
            <igx-row-island [key]="'childData'" [autoGenerate]="true" #rowIsland2 >
            </igx-row-island>
        </igx-row-island>
    </igx-hierarchical-grid>`
})
export class IgxHierarchicalGridTestBaseComponent {
    public data;
    @ViewChild('hierarchicalGrid', { read: IgxHierarchicalGridComponent }) public hgrid: IgxHierarchicalGridComponent;
    @ViewChild('rowIsland', { read: IgxRowIslandComponent }) public rowIsland: IgxRowIslandComponent;
    @ViewChild('rowIsland2', { read: IgxRowIslandComponent }) public rowIsland2: IgxRowIslandComponent;

    constructor() {
        // 3 level hierarchy
        this.data = this.generateDataUneven(20, 3);
    }
    generateDataUneven(count: number, level: number, parendID: string = null) {
        const prods = [];
        const currLevel = level;
        let children;
        for (let i = 0; i < count; i++) {
            const rowID = parendID ? parendID + i : i.toString();
            if (level > 0 ) {
               // Have child grids for row with even id less rows by not multiplying by 2
               children = this.generateDataUneven((i % 2 + 1) * Math.round(count / 3) , currLevel - 1, rowID);
            }
            prods.push({
                ID: rowID, ChildLevels: currLevel,  ProductName: 'Product: A' + i, 'Col1': i,
                'Col2': i, 'Col3': i, childData: children, childData2: children });
        }
        return prods;
    }
}

@Component({
    template: `
    <igx-hierarchical-grid #grid1 [data]="data" [autoGenerate]="false" [height]="'400px'" [width]="'500px'" #hierarchicalGrid>
    <igx-column field="ID"></igx-column>
    <igx-column field="ProductName"></igx-column>
        <igx-row-island [key]="'childData'" [autoGenerate]="false" [height]="height" #rowIsland1>
            <igx-column field="ID"></igx-column>
            <igx-column field="ProductName"></igx-column>
        </igx-row-island>
        <igx-row-island [key]="'childData2'" [autoGenerate]="false" [height]="height" #rowIsland2>
            <igx-column field="Col1"></igx-column>
            <igx-column field="Col2"></igx-column>
            <igx-column field="Col3"></igx-column>
        </igx-row-island>
    </igx-hierarchical-grid>`
})
export class IgxHierarchicalGridMultiLayoutComponent extends IgxHierarchicalGridTestBaseComponent {
    public height = '100px';
    @ViewChild('rowIsland1', { read: IgxRowIslandComponent }) public rowIsland1: IgxRowIslandComponent;
    @ViewChild('rowIsland2', { read: IgxRowIslandComponent }) public rowIsland2: IgxRowIslandComponent;
}

@Component({
    template: `
        <igx-hierarchical-grid [data]="data" (onDataPreLoad)="dataLoading($event)"
         [isLoading]="true" [autoGenerate]="true" [height]="'600px'">
            <igx-row-island [key]="'childData'" [autoGenerate]="false" #rowIsland1>
                <igx-column field="ID"></igx-column>
                <igx-column field="ProductName"></igx-column>
                <igx-row-island [key]="'childData2'" [autoGenerate]="true" #rowIsland2>
                </igx-row-island>
            </igx-row-island>
        </igx-hierarchical-grid>
    `
})
export class IgxHGridRemoteOnDemandComponent {
    public data;

    @ViewChild(IgxHierarchicalGridComponent, { read: IgxHierarchicalGridComponent })
    public instance: IgxHierarchicalGridComponent;

    @ViewChild('customTemplate', { read: TemplateRef })
    public customTemaplate: TemplateRef<any>;

    @ViewChild('rowIsland1', { read: IgxRowIslandComponent })
    public rowIsland: IgxRowIslandComponent;

    @ViewChild('rowIsland2', { read: IgxRowIslandComponent })
    public rowIsland2: IgxRowIslandComponent;

    constructor(public cdr: ChangeDetectorRef) { }

    generateDataUneven(count: number, level: number, parendID: string = null) {
        const prods = [];
        const currLevel = level;
        for (let i = 0; i < count; i++) {
            const rowID = parendID ? parendID + i : i.toString();
            prods.push({
                ID: rowID, ChildLevels: currLevel,  ProductName: 'Product: A' + i, 'Col1': i,
                'Col2': i, 'Col3': i });
        }
        return prods;
    }

    bind () {
        this.data = this.generateDataUneven(20, 3);
    }
}

@Component({
    template: `
    <igx-hierarchical-grid #hierarchicalGrid [data]="data" [autoGenerate]="false" [height]="'500px'" [width]="'800px'" >
        <igx-column field="ID"></igx-column>
        <igx-column field="ProductName"></igx-column>
        <igx-row-island [key]="'childData'" [autoGenerate]="false" #rowIsland [height]="'350px'">
            <igx-column *ngFor="let colField of islandCols1" [field]="colField"></igx-column>
            <igx-row-island [key]="'childData'" [autoGenerate]="false" #rowIsland2 [height]="'200px'">
                <igx-column *ngFor="let colField of islandCols2" [field]="colField"></igx-column>
            </igx-row-island>
        </igx-row-island>
    </igx-hierarchical-grid>`
})
export class IgxHierarchicalGridColumnsUpdateComponent extends IgxHierarchicalGridTestBaseComponent implements AfterViewInit {
    public cols1 = ['ID', 'ProductName', 'Col1', 'Col2', 'Col3'];
    public cols2 =  ['ID', 'ProductName', 'Col1'];
    public islandCols1 = [];
    public islandCols2 = [];
    constructor(public cdr: ChangeDetectorRef) {
        super();
    }

    ngAfterViewInit() {
        this.islandCols1 = this.cols1;
        this.islandCols2 = this.cols2;
        this.cdr.detectChanges();
    }
}

