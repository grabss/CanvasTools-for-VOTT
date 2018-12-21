import { Point2D } from "../../Core/Point2D";
import { Rect } from "../../Core/Rect";
import { RegionData } from "../../Core/RegionData";
import { TagsDescriptor } from "../../Core/TagsDescriptor";

import { IEventDescriptor } from "../../Interface/IEventDescriptor";
import { IFreezable } from "../../Interface/IFreezable";
import { IHideable } from "../../Interface/IHideadble";
import { IMovable } from "../../Interface/IMovable";
import { IResizable } from "../../Interface/IResizable";
import { ITagsUpdateOptions } from "../../Interface/ITagsUpdateOptions";

import { ChangeEventType, ChangeFunction, ManipulationFunction, RegionComponent } from "../RegionComponent";
import { AnchorsElement } from "./AnchorsElements";
import { DragElement } from "./DragElement";
import { TagsElement } from "./TagsElement";

import * as SNAPSVG_TYPE from "snapsvg";

declare var Snap: typeof SNAPSVG_TYPE;

export class PolylineRegion extends RegionComponent {
    // Region components
    public node: Snap.Element;
    private anchorNode: AnchorsElement;
    private dragNode: DragElement;
    private tagsNode: TagsElement;
    private toolTip: Snap.Fragment;
    private UI: Array<RegionComponent>;

    // Region data
    public tags: TagsDescriptor;

    // Region ID
    public ID: string;
    // Region styles
    public regionID: string
    private styleID: string;
    private styleSheet: CSSStyleSheet = null;

    // Bound rects
    private paperRects: { host: Rect, actual: Rect };

    // Manipulation notifiers
    public isSelected: boolean = false;

    // Styling options
    private tagsUpdateOptions: ITagsUpdateOptions;

    constructor(paper: Snap.Paper, paperRect: Rect = null, regionData:RegionData, id: string, tagsDescriptor: TagsDescriptor, onManipulationBegin?: ManipulationFunction, onManipulationEnd?: ManipulationFunction, tagsUpdateOptions?: ITagsUpdateOptions) {
        super(paper, paperRect, regionData);

        this.ID = id;
        this.tags = tagsDescriptor;

        if (paperRect !== null) {
            this.paperRects = {
                actual: new Rect(paperRect.width - regionData.width, paperRect.height - regionData.height),
                host: paperRect,
            };
        }

        if (onManipulationBegin !== undefined) {
            this.onManipulationBegin = () => {
                onManipulationBegin(this);
            }
        }
        if (onManipulationEnd !== undefined) {
            this.onManipulationEnd = () => {
                onManipulationEnd(this);
            };
        }

        this.regionID = this.s8();
        this.styleID = `region_${this.regionID}_style`;
        this.styleSheet = this.insertStyleSheet();
        this.tagsUpdateOptions = tagsUpdateOptions;

        this.buildOn(paper);
        this.move(this.x, this.y);
    }

    private buildOn(paper: Snap.Paper) {
        this.node = paper.g();
        this.node.addClass("regionStyle");
        this.node.addClass(this.styleID);

        this.dragNode = new DragElement(paper, this.paperRects.actual, this.regionData, this.onInternalChange.bind(this), this.onManipulationBegin, this.onManipulationEnd);
        this.tagsNode = new TagsElement(paper, this.paperRect, this.regionData, this.tags, this.styleID, this.styleSheet, this.tagsUpdateOptions);
        this.anchorNode = new AnchorsElement(paper, this.paperRect, this.regionData, this.onInternalChange.bind(this), this.onManipulationBegin, this.onManipulationEnd);

        this.toolTip = Snap.parse(`<title>${(this.tags !== null) ? this.tags.toString() : ""}</title>`);
        this.node.append(<any>this.toolTip);

        this.node.add(this.dragNode.node);
        this.node.add(this.tagsNode.node);
        this.node.add(this.anchorNode.node);

        this.UI = new Array<RegionComponent>(this.tagsNode, this.dragNode, this.anchorNode);
    }

    // Helper function to generate random id;
    private s8() {
        return Math.floor((1 + Math.random()) * 0x100000000)
            .toString(16)
            .substring(1);
    }

    // Helper function to insert a new stylesheet into the document
    private insertStyleSheet(): CSSStyleSheet {
        var style = document.createElement("style");
        style.setAttribute("id", this.styleID);
        document.head.appendChild(style);
        return style.sheet as CSSStyleSheet;
    }

    public removeStyles() {
        document.getElementById(this.styleID).remove();
    }

    private onInternalChange(component: RegionComponent, regionData: RegionData, state: ChangeEventType, multiSelection: boolean = false) {
        this.regionData.initFrom(regionData);
        this.paperRects.actual.resize(this.paperRects.host.width - regionData.width, this.paperRects.host.height - regionData.height);
        this.redraw();

        this.onChange(this, this.regionData.copy(), state, multiSelection);
    }

    public updateTags(tags: TagsDescriptor, options?: ITagsUpdateOptions) {
        this.tagsNode.updateTags(tags, options);
        this.tags = tags;
        this.node.select("title").node.innerHTML = (tags !== null) ? tags.toString() : "";
    }

    public move(point: IMovable): void;
    public move(x: number, y: number): void;
    public move(arg1: any, arg2?: any) {
        super.move(arg1, arg2);
        this.redraw();
    }

    public resize(width: number, height: number) {
        super.resize(width, height);
        this.paperRects.actual.resize(this.paperRects.host.width - width, this.paperRects.host.height - height);
        this.redraw();
    }

    public redraw() {
        this.UI.forEach((element) => {
            element.redraw();
        });
    }

    public select() {
        this.isSelected = true;
        this.node.addClass("selected");

        /*             if (this.onChange != undefined) {
                        this.onChange(this, this.isSelected);
                    } */
    }

    public unselect() {
        this.isSelected = false;
        this.node.removeClass("selected");

        /*             if (this.onChange != undefined) {
                        this.onChange(this, this.isSelected);
                    } */
    }

    public freeze() {
        if (!this.isFrozen) {
            this.isFrozen = true;
            this.node.addClass('old');
            this.dragNode.freeze();
        }
    }

    public unfreeze() {
        if (this.isFrozen) {
            this.isFrozen = false;
            this.node.removeClass('old');
            this.dragNode.unfreeze();
        }
    }
}