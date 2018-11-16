import { Pipe, PipeTransform } from '@angular/core';
import { cloneArray } from '../../core/utils';
import { DataUtil } from '../../data-operations/data-util';
import { IGroupByResult } from '../../data-operations/sorting-strategy';
import { GridBaseAPIService } from '../api.service';
import { IgxHierarchicalGridComponent } from './hierarchical-grid.component';
import { IgxHierarchicalGridAPIService } from './hierarchical-grid-api.service';
/**
 *@hidden
 */
@Pipe({
    name: 'gridHierarchical',
    pure: true
})
export class IgxGridHierarchicalPipe implements PipeTransform {
    private hGridAPI: IgxHierarchicalGridAPIService;

    constructor(gridAPI: GridBaseAPIService<IgxHierarchicalGridComponent>) {
        this.hGridAPI = <IgxHierarchicalGridAPIService>gridAPI;
     }

    public transform(
        collection: IGroupByResult,
        state = [],
        id: string,
        primaryKey: any,
        childKey: string,
        pipeTrigger: number
        ): IGroupByResult {
        if (!childKey) {
            return collection;
        }
        const result: IGroupByResult = {
            data: this.addHierarchy(cloneArray(collection.data), state, primaryKey, childKey),
            metadata: this.addHierarchy(cloneArray(collection.metadata), state, primaryKey, childKey)
        };
        return result;
    }

    public isExpanded<T>(state, record, primaryKey): boolean {
        for (let i = 0; i < state.length; i++) {
            if ((primaryKey && state[i].rowID === record[primaryKey]) ||
                (!primaryKey && state[i].rowID === record)) {
                return true;
            }
        }
        return false;
    }

    public addHierarchy<T>(data: T[], state, primaryKey, childKey): T[] {
        const result = [];

        data.forEach((v) => {
            result.push(v);
            if (v[childKey] && this.isExpanded(state, v, primaryKey)) {
                result.push({rowID: primaryKey ? v[primaryKey] : v,  childGridData: v[childKey], key: childKey });
            }
        });
        return result;
    }
}
