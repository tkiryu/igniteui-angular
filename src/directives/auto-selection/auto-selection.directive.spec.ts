import { Component, DebugElement, ViewChild } from "@angular/core";
import {
    async,
    TestBed
} from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { IgxAutoSelectDirective} from "./auto-selection.directive";

describe("IgxAutoSelection", () => {
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                IgxAutoSelectDirective,
                TriggerAutoSelectionComponent,
                TriggerAutoSelectionOnClickComponent
            ]
        });
    }));

    it("Should select the text which is into the input", () => {
        const fix = TestBed.createComponent(TriggerAutoSelectionComponent);
        fix.detectChanges();

        const input = fix.debugElement.query(By.css("input")).nativeElement;

        fix.whenStable().then(() => {
            expect(input.selectionEnd).toEqual(input.value.length);
            expect(input.value.substring(input.selectionStart, input.selectionEnd)).toEqual(input.value);
        });
    });

    it("Should select the text when the input is clicked", () => {
        const fix = TestBed.createComponent(TriggerAutoSelectionOnClickComponent);
        fix.detectChanges();

        const input: DebugElement = fix.debugElement.query(By.css("input"));
        const inputNativeElem = input.nativeElement;
        const inputElem: HTMLElement = input.nativeElement;

        inputElem.click();
        fix.detectChanges();

        fix.whenStable().then(() => {
            expect(inputNativeElem.selectionEnd).toEqual(inputNativeElem.value.length);
            expect(inputNativeElem.value.substring(inputNativeElem.selectionStart, inputNativeElem.selectionEnd))
                .toEqual(inputNativeElem.value);
        });
    });

    it("Shouldn't make a selection when the state is set to false", () => {
        const template = ` <input type="text" [igxAutoSelect]="false" #autoSelect="igxSelection"
            (click)="autoSelect.trigger()" value="Some custom value!" />`;

        TestBed.overrideComponent(TriggerAutoSelectionOnClickComponent, {
            set: {
                template
            }
        });

        TestBed.compileComponents().then(() => {
            const fix = TestBed.createComponent(TriggerAutoSelectionOnClickComponent);
            fix.detectChanges();

            const input = fix.debugElement.query(By.css("input"));
            const inputNativeElem = input.nativeElement;
            const inputElem: HTMLElement = input.nativeElement;

            inputElem.click();
            fix.detectChanges();

            expect(inputNativeElem.selectionEnd).toEqual(0);
            expect(inputNativeElem.value.substring(inputNativeElem.selectionStart, inputNativeElem.selectionEnd)).toEqual("");
        });
    });
});

@Component({
    template:
        `
            <input type="text" [igxAutoSelect]="true" value="Some custom value!" />
        `
})
class TriggerAutoSelectionComponent {}

@Component({
    template:
        `
            <input type="text" [igxAutoSelect] #autoSelect="igxSelection" (click)="autoSelect.trigger()" value="Some custom value!" />
        `
})
class TriggerAutoSelectionOnClickComponent {}
