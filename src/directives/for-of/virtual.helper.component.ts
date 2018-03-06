import { Component, ElementRef, HostBinding, Input, OnInit, ViewChild, ViewContainerRef } from "@angular/core";

@Component({
    selector: "igx-virtual-helper",
    template: "<div #container class='igx-vhelper__placeholder-content' [style.height.px]='height'></div>"
})
export class VirtualHelperComponent implements OnInit {
    @ViewChild("container", { read: ViewContainerRef }) public _vcr;
    @Input() public itemsLength: number;
    public height: number;

    @HostBinding("class.igx-vhelper--vertical")
    public cssClasses = true;

    @HostBinding("class.igx-vhelper--inactive")
    public notVislbe = false;

    constructor(public elementRef: ElementRef) { }

    public ngOnInit() {
    }

}
