/* eslint-disable no-undef */
import Icon from "sap/ui/core/Control";
//import Icon from "sap/ui/core/Icon";
import type { MetadataOptions } from "sap/ui/core/Element";
import IconAngelRenderer from "./IconAngelRenderer";

/**
 * @namespace racedash.control
 */
export default class IconAngle extends Icon {
    // The following three lines were generated and should remain as-is to make TypeScript aware of the constructor signatures
    constructor(idOrSettings?: string | $IconAngleSettings);
    constructor(id?: string, settings?: $IconAngleSettings);
    constructor(id?: string, settings?: $IconAngleSettings) { super(id, settings); }

    static readonly metadata: MetadataOptions = {
        properties: {
            angle: {
                type: "string",
                group: "Appearance",
                defaultValue: 0
            }
        }
    };

    static renderer: typeof IconAngelRenderer = IconAngelRenderer;
}
