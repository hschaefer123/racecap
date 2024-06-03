import Controller from "sap/ui/core/mvc/Controller";
import Formatter from "../model/formatter";
import Component from "racedash/Component";
import { getCloudEvent } from "racedash/service/WebSocketService";

/**
 * @namespace racedash.controller
 */
export default class Dashboard extends Controller {

    // formatter
    formatter: Formatter = new Formatter();

    /*eslint-disable @typescript-eslint/no-empty-function*/
    async onInit(): Promise<void> { }

    handleRecord() {
        //const button = evt.getSource() as Button;     
        const appComponent = this.getOwnerComponent() as Component;
        const ws = appComponent.webSocketService.ws;
        const wsModel = appComponent.webSocketService.model;
        const recording = wsModel.getProperty("/recording");

        ws?.send(JSON.stringify(
            getCloudEvent("recording", {
                "recording": !recording
            })
        ));

        /*
        ws?.send(JSON.stringify({
            "specversion": "1.0",
            "type": "racedash.event.recording",
            "source": "/message",
            "time": new Date().toISOString(),
            "datacontenttype": "application/json",
            "data": {
                "recording": !recording
            }
        }));
        */
    }

}