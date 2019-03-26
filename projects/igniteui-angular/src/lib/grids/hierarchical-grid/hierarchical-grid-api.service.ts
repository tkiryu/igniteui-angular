import { IgxHierarchicalGridComponent } from './hierarchical-grid.component';
import { IgxRowIslandComponent } from './row-island.component';
import { Subject } from 'rxjs';
import { IPathSegment } from './hierarchical-grid-base.component';
import { IgxGridBaseComponent, GridBaseAPIService, IGridDataBindable } from '../grid';
export class IgxHierarchicalGridAPIService extends GridBaseAPIService<IgxGridBaseComponent & IGridDataBindable> {
    protected layouts: Map<string, IgxRowIslandComponent> = new Map<string, IgxRowIslandComponent>();
    protected layoutChildGrids:  Map<string, Map<any, IgxHierarchicalGridComponent>> =
    new Map<string, Map<any, IgxHierarchicalGridComponent>>();
    protected gridsPerLayout: Map<string, IgxHierarchicalGridComponent[]> = new Map<any, IgxHierarchicalGridComponent[]>();
    registerLayout(layout: IgxRowIslandComponent) {
        this.layouts.set(layout.id, layout);
        this.destroyMap.set(layout.id, new Subject<boolean>());
    }

    getChildGrid(id: string, path: Array<IPathSegment>) {
        const currPath = path;
        const ownerGrid = this.get(id) as IgxHierarchicalGridComponent;
        let childGrid;
        let targetLayout;
        const pathElem = currPath.shift();
        ownerGrid.childLayoutList.forEach((layout) => {
            if (layout.key === pathElem.rowIslandKey) {
                 targetLayout = layout;
            }
        });
        const childrenForLayout = this.layoutChildGrids.get(targetLayout.id);
        if (childrenForLayout) {
            const grid = childrenForLayout.get(pathElem.rowID);
            if (currPath.length === 0) {
                childGrid = grid;
            } else {
                childGrid = grid.hgridAPI.getChildGrid(grid.id, currPath);
            }
        }
        return childGrid;
    }

    getChildGrids(inDepth?: boolean) {
        let allChildren = [];
        const ownerGrid = Array.from(this.state.values())[0] as IgxHierarchicalGridComponent;
        if ((!ownerGrid.parent && inDepth) || (ownerGrid.parent && !inDepth)) {
            this.layouts.forEach((layout) => {
                allChildren = allChildren.concat(this.getChildGridsForRowIsland(layout.id));
            });
        } else if (!ownerGrid.parent) {
            ownerGrid.childLayoutList.forEach((layout) => {
                allChildren = allChildren.concat(this.getChildGridsForRowIsland(layout.id));
            });
        } else {
            this.layoutChildGrids.forEach((layoutMap) => {
                layoutMap.forEach((grid) => {
                    allChildren.push(grid);
                    if (inDepth) {
                        const children = grid.hgridAPI.getChildGrids(inDepth);
                        children.forEach((item) => {
                            allChildren.push(item);
                        });
                    }
                });
            });
        }

        return allChildren;
    }

    getParentRowId(childGrid: IgxHierarchicalGridComponent) {
        let rowID;
        this.layoutChildGrids.forEach((layoutMap) => {
            layoutMap.forEach((grid, key) => {
                if (grid === childGrid) {
                    rowID = key;
                    return;
                }
            });
        });
        return rowID;
    }

    registerChildGrid(parentRowID: string|object, layoutID: string, grid: IgxHierarchicalGridComponent) {
        let childrenForLayout = this.layoutChildGrids.get(layoutID);
        if (!childrenForLayout) {
            this.layoutChildGrids.set(layoutID, new Map<any, IgxHierarchicalGridComponent>());
            childrenForLayout = this.layoutChildGrids.get(layoutID);
        }
        childrenForLayout.set(parentRowID, grid);
    }

    getLayout(id: string) {
      return this.layouts.get(id);
    }

    getChildGridsForRowIsland(layoutID): IgxHierarchicalGridComponent[] {
        const childrenForLayout = this.layoutChildGrids.get(layoutID);
        const children = [];
        if (childrenForLayout) {
            childrenForLayout.forEach((child) => {
                children.push(child);
            });
        }
        return children;
    }

    getChildGridByID(layoutID, rowID) {
        const childrenForLayout = this.layoutChildGrids.get(layoutID);
        return childrenForLayout.get(rowID);
    }
}
