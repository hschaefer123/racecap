import WebSocket from 'ws'
import * as cds from '@sap/cds'
import { Service, log } from '@sap/cds'
import { SimulatorInterfacePacket, getMockData } from './lib/utils/parser'
import { getCarName } from './lib/SqliteExporter'

export type CloudEvent = {
    id: string,
    specversion: "1.0",
    type: string,
    source: string,
    time: string,
    datacontenttype: string,
    data: unknown
}

const LOG = log('websocket-service')

let simulatorData: SimulatorInterfacePacket = null
let recording: boolean = false

module.exports = class WebSocketService extends Service {
    async init() {
        const wss = new WebSocket.Server({ noServer: true })

        // attach to cap express http server
        cds.on("listening", ({ server }) => {
            server.on("upgrade", (request, socket, head) => {
                if (request.url === "/ws") {
                    wss.handleUpgrade(request, socket, head, function done(ws) {
                        wss.emit("connection", ws, request)
                    })
                } else {
                    LOG._warn && LOG.warn(`Pathname ${request.url} not allowed for WebSocket connection`)
                    socket.destroy()
                }
            })
        })

        this.on("SIPGT7", async (msg) => {
            simulatorData = msg.data as SimulatorInterfacePacket
            simulatorData.recording = recording
            simulatorData.connections = wss.clients.size
            simulatorData.carName = await getCarName(simulatorData.carCode)
            wss.clients.forEach(function each(client) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(getCloudEvent("sip", simulatorData)))
                }
            })
            //ws.send(JSON.stringify(getCloudEvent("sip", simulatorData)))
        })

        this.on("STOPRECORDING", async () => {
            LOG._info && LOG.info("on STOPRECORDING")
            wss.clients.forEach(function each(client) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(getCloudEvent("recording", {
                        "recording": false
                    })))
                }
            })
        })

        wss.on("connection", (ws: WebSocket) => {
            //ws.id = req.headers.get("sec-websocket-key") 

            // send one test dataset mockdata for offline testing
            //const mockData = simulatorMockData
            const mockData = getMockData()
            mockData.recording = recording
            mockData.connections = wss.clients.size
            ws.send(JSON.stringify(getCloudEvent("sip", mockData)))

            ws.on("message", async function message(data) {
                //@ts-ignore
                const event = JSON.parse(data)
                switch (event.type) {
                    case "racedash.event.recording":
                        recording = event?.data?.recording
                        LOG._debug && LOG.debug("racedash.event.recording", recording)
                        const sipgt7Srv = await cds.connect.to('SIPGT7Service')
                        sipgt7Srv.emit("Recording", { recording: recording })
                        // broadcast to all clients
                        wss.clients.forEach(function each(client) {
                            if (client.readyState === WebSocket.OPEN) {
                                client.send(JSON.stringify(getCloudEvent("recording", {
                                    "recording": recording
                                })))
                            }
                        })
                        break
                }
            })
        })

        //return await super.init()
        return super.init()
    }
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
    }
}