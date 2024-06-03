import AppComponent from "../Component";
import JSONModel from "sap/ui/model/json/JSONModel";
import WebSocket, { WebSocket$MessageEventParameters } from "sap/ui/core/ws/WebSocket";
import Event from "sap/ui/base/Event";

type WebSocketSettings = {
    modelName: "ws";
};
const modelName: WebSocketSettings["modelName"] = "ws";

export type Model = {
    connected: boolean,
    sip: object,
}

export default class WebSocketService extends Object {
    appComponent!: AppComponent;
    model: JSONModel;
    ws: WebSocket | null;

    private initialReconnectDelay: number;
    private currentReconnectDelay: number;
    private maxReconnectDelay: number;
    private reConnect = true;

    constructor(component: AppComponent) {
        super(component);

        this.appComponent = component;

        // reconnect handling
        this.initialReconnectDelay = 1000;
        this.maxReconnectDelay = 16000;
        this.currentReconnectDelay = this.initialReconnectDelay;

        // use and publish service model
        this.model = new JSONModel({
            connected: false,
            recording: false,
            sip: {
                packetId: 1,
                lapCount: 2,
                lapsInRace: 4,
                currentLapTime: 31550,
                preRaceStartPositionOrQualiPos: 3,
                numCarsAtPreRace: 16,
                lastLapTime: 47400,
                bestLapTime: 47300,
                currentGear: 1,
                suggestedGear: 2,
                calculatedMaxSpeed: 257,
                tireSurfaceTemperature: {
                    FrontLeft: 58.25,
                    FrontRight: 58.25,
                    RearLeft: 58.25,
                    RearRight: 58.25
                },
                engineRPM: 3776,
                brake: 0,
                throttle: 70,
                gasLevel: 18,
                gasCapacity: 60,
                oilPressure: 8,
                waterTemperature: 85,
                oilTemperature: 110
            }
        });
        this.appComponent.setModel(this.model, modelName);

        this.connect();
    }

    public connect() {
        const ws = new WebSocket("/ws");
        this.ws = ws;

        if (this.ws) {
            // connection opened
            this.ws.attachOpen(() => {
                this.currentReconnectDelay = this.initialReconnectDelay;
                this.model.setProperty("/connected", true);
            });

            // server messages
            this.ws.attachMessage((evt: Event<WebSocket$MessageEventParameters>) => {
                const event = JSON.parse(evt.getParameter("data") as string);

                //console.log("data", event, event.data.recording);
                if (event.type === "racedash.event.recording") {
                    this.model.setProperty("/recording", event.data.recording);
                } else if (event.type === "racedash.event.sip") {
                    //this.model.setData(event);
                    this.model.setProperty("/sip", event.data);
                }

                //console.log("msg", event, this.model);

                // message handler
                //switch (event.type) { case 'udina.portal.event.broadcast.message':}
            });

            // onConnectionError
            this.ws.attachError(() => {
                this.setDisconnected();
            });

            // onConnectionClose
            this.ws.attachClose(() => {
                this.setDisconnected();
                this.ws = null;
                if (this.reConnect) {
                    // eslint-disable-next-line fiori-custom/sap-timeout-usage
                    setTimeout(() => {
                        this.reconnect();
                    }, this.currentReconnectDelay + Math.floor(Math.random() * 2000));
                }
            });
        }
    }

    private reconnect() {
        if (this.reConnect) {
            if (this.currentReconnectDelay < this.maxReconnectDelay) {
                this.currentReconnectDelay *= 2;
            }
            //console.log("try ws reconnect", this.iCurrentReconnectDelay *= 2)
            this.connect();
        }
    }

    private close() {
        this.reConnect = false;
        if (this.ws) {
            this.ws.close();
        }
    }

    private setDisconnected() {
        //console.log("setDisconnected...");
        this.model.setProperty("/connected", false);
    }

}

export type CloudEvent = {
    id: string,
    specversion: "1.0",
    type: string,
    source: string,
    time: string,
    datacontenttype: string,
    data: unknown
}

export function getCloudEvent(type: string, data: unknown): CloudEvent {
    return {
        "id": "1",
        "specversion": "1.0",
        "type": `racedash.event.${type}`,
        "source": "/message",
        "time": new Date().toISOString(),
        "datacontenttype": "application/json",
        "data": data
    };
}
