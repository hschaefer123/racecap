import RenderManager from "sap/ui/core/RenderManager";
import IconAngle from "./IconAngle";
//import Icon from "sap/ui/core/Icon";

/**
 * IconAngle renderer.
 * @namespace racedash.control
 */
export default {
    apiVersion: 2, // usage of DOM Patcher

    /*
    renderer: {
        writeInnerAttributes: function (rm: RenderManager, control: IconAngle) {
            // eslint-disable-next-line prefer-rest-params
            sap.ui.core.IconRenderer.writeInnerAttributes.apply(this);
            // the default method should be    
            // this will make sure that all default input attributes will be there
            rm.style("--rotation", control.getAngle());
        }
    }
    */

    render: function (rm: RenderManager, control: IconAngle) {
        rm.openStart("div", control);
        rm.class("uUiIconAngle");
        //rm.style("rotation", control.getAngle());
        rm.style("background-color", "red");
        rm.openEnd();
        //rm.renderControl(control);
        rm.close("div");
    }

};