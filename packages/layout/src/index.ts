import { cursorTo } from 'node:readline';
import Yoga, { Edge, FlexDirection, Direction, Justify, Align } from 'yoga-layout';

class Node {
    private node: Yoga.Node;

    constructor(public style: Record<string, any>) {
        this.node = Yoga.Node.create();
    }

    layout() {
        // apply this.style CSS properties to yoga properties
        for (const [key, value] of Object.entries(this.style)) {
            switch (key) {
                case 'flexDirection':
                    this.node.setFlexDirection(FlexDirection[value]);
                    break;
                case 'justifyContent':
                    this.node.setJustifyContent(Justify[value.toUpperCase()]);
                    break;
                case 'alignItems':
                    this.node.setAlignItems(Align[value.toUpperCase()]);
                    break;
                case 'alignSelf':
                    this.node.setAlignSelf(Align[value.toUpperCase()]);
                    break;
                case 'width':
                    this.node.setWidth(value);
                    break;
                case 'height':
                    this.node.setHeight(value);
                    break;
                case 'margin':
                    // parse margin shorthand
                    
                    this.node.setMargin(Edge.All, value);
                    break;
                case 'padding':
                    this.node.setPadding(Edge.All, value);
                    break;
                default:
                    console.warn(`Unsupported style property: ${key}`);
            }
        }
    }



}

function run() {
	const root = Yoga.Node.create();
	root.setFlexDirection(FlexDirection.Row);
	root.setWidth('100%');
	root.setHeight('100%');

    const child0 = Yoga.Node.create();
    child0.setMargin(Edge.Left, 1);
    child0.setMargin(Edge.Right, 'auto');
    child0.setPadding(Edge.Horizontal, 1);
    child0.setWidth('Hello world'.length);
    root.insertChild(child0, 0);

    root.calculateLayout(process.stdout.columns, process.stdout.rows, Direction.LTR);

    console.clear();
    cursorTo(process.stdout, root.getComputedLeft(), root.getComputedTop());
    process.stdout.write('-'.repeat(root.getComputedWidth()));
    cursorTo(process.stdout, child0.getComputedLeft(), child0.getComputedTop());
    process.stdout.write(' Hello world ');
    process.stdout.write('\n');
}

run()
