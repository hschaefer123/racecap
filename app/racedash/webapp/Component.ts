import BaseComponent from "sap/ui/core/UIComponent";
import { createDeviceModel } from "./model/models";
import JSONModel from "sap/ui/model/json/JSONModel";
import WebSocketService from "./service/WebSocketService";

export type AppManifest = {
    "sap.app": {
        id: string,
        applicationVersion: {
            version: string
        }
    }
}

/**
 * @namespace racedash
 */
export default class Component extends BaseComponent {
    webSocketService: WebSocketService;

    public static metadata = {
        manifest: "json"
    };

    /**
     * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
     * @public
     * @override
     */
    init(): void {
        // call the base component's init function
        super.init();

        // enable routing
        this.getRouter().initialize();

        // set the device model
        this.setModel(createDeviceModel(), "device");

        // app model 
        const appManifest = (this.getManifest() as AppManifest)["sap.app"];
        const componentId = appManifest.id as string;
        this.setModel(new JSONModel({
            path: sap.ui.require.toUrl(componentId?.replace(/\./g, "/")),
        }), "app");

        // web socket
        this.webSocketService = new WebSocketService(this);
    }

}