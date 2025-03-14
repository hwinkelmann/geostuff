import { DoubleVector2 } from "./geometry/DoubleVector2";

export class KeyTracker {
    public keys: { [key: string]: boolean } = {};

    private isDragging = false;
    private dragStart = new DoubleVector2(0, 0);
    private mousePosition = new DoubleVector2(0, 0);

    constructor(private resetMouseDelta: boolean = true) {
        window.addEventListener("keydown", this.onKeyDown.bind(this));
        window.addEventListener("keyup", this.onKeyUp.bind(this));
        window.addEventListener("blur", this.onBlur.bind(this));

        window.addEventListener("mousedown", this.onMouseDown.bind(this));
        window.addEventListener("mouseup", this.onMouseUp.bind(this));
        window.addEventListener("mouseout", this.onMouseUp.bind(this));
        window.addEventListener("mousemove", (event) => {
            this.mousePosition = new DoubleVector2(event.clientX, event.clientY);
        });
    }

    public dispose() {
        window.removeEventListener("keydown", this.onKeyDown);
        window.removeEventListener("keyup", this.onKeyUp);

        window.removeEventListener("mousedown", this.onMouseDown);
        window.removeEventListener("mouseup", this.onMouseUp);
    }

    private onKeyDown(event: KeyboardEvent) {
        this.keys[event.key.toLowerCase()] = true;
    }

    private onKeyUp(event: KeyboardEvent) {
        this.keys[event.key.toLowerCase()] = false;
    }

    private onBlur() {
        for (const key in this.keys)
            this.keys[key] = false;

        this.isDragging = false;
    }

    private onMouseDown(event: MouseEvent) {
        this.isDragging = true;
        this.dragStart = new DoubleVector2(event.clientX, event.clientY);
    }

    private onMouseUp() {
        this.isDragging = false;
    }

    public getDragDelta() {
        if (!this.isDragging)
            return new DoubleVector2(0, 0);

        const result = this.mousePosition.clone().subtract(this.dragStart);

        if (this.resetMouseDelta)
            this.dragStart = this.mousePosition.clone();

        return result;
    }

    public isKeyDown(key: string) {
        return this.keys[key] ?? false;
    }
}