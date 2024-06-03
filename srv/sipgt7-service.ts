import * as cds from '@sap/cds'
import { Service, log } from '@sap/cds'
import { Socket, createSocket, RemoteInfo } from 'node:dgram'
import { decrypt } from './lib/utils/decoder'
import LapCounter from './lib/utils/lapcounter'
import { SimulatorFlags, SimulatorInterfacePacket, getMockData, gt7parser } from './lib/utils/parser'
import { logSession, updateSession, logSimulatorInterfacePacket, getCarName } from './lib/SqliteExporter'

type Recording = {
    recording: boolean,
}

const LOG = log('sipgt7-service')
const { sqlite, otlp, simulation, simulationSession } = cds.env?.services
//const environment = process.env.NODE_ENV || 'development';
const _in_sqlite = cds.env.env  === 'sqlite'
const _in_development = !_in_sqlite
const bindPort: number = 33740
const receivePort: number = 33739
const psIp: string = process.env.PLAYSTATION_IP

module.exports = class SIPGT7Service extends Service {
    socket: Socket
    lapCounter = new LapCounter()
    isUdpSocketReady = false
    recording = false
    sessionId: string = null
    packetCount = 0
    lastLapRecorded = false
    lastLap = -1
    distance = 0
    startTimeOfDayProgression: number

    async init() {
        const socket = this.socket = createSocket('udp4')
        const { SimulatorInterfacePackets } = require('#cds-models/gt7')

        // cross service dependencies
        const wsSrv = await cds.connect.to('WebSocketService')
        const otlpSrv = await cds.connect.to('OTLPService')

        // web socket message to control recording
        this.on("Recording", async (msg) => {
            this.onRecording(msg.data as Recording, wsSrv, otlpSrv)
        })

        socket.on('message', (data: Buffer, rinfo: RemoteInfo) => {
            if (data.length === 0x128) {
                const packet: Buffer = decrypt(data)
                const magic = packet.readInt32LE()
                // 0x30533647 = G6S0 - GT6
                // 0x47375330 = 0S7G - GTSport/GT7
                if (magic != 0x47375330) { // GT6 should also work!
                    // 0S7G - G7S0
                    LOG._error && LOG.error('on packet:', "Magic error!", magic)
                } else {
                    const message = gt7parser.parse(packet) as SimulatorInterfacePacket
                    //this.onMessage(data, socket, wsSrv, otlpSrv)
                    this.onMessage(message, wsSrv, otlpSrv)
                }
            }
        })

        socket.on('listening', () => {
            const address = this.socket.address()
            this.isUdpSocketReady = true
            LOG._info && LOG.info(`SIP GT7 server listening on UDP ${address.address}:${address.port} for IP ${psIp}`)
            this.sendHeartbeat()
        })

        socket.on('error', (err) => {
            LOG._error && LOG.error(`server error:\n${err.stack}`)
            socket.close()
        })

        if (simulation && _in_development) {
            const sips: typeof SimulatorInterfacePackets = await SELECT
                .from(SimulatorInterfacePackets)
                .where({ session_ID: simulationSession })
                .orderBy("packetId")

            if (sips.length == 0) {
                LOG._error && LOG.error(`Simulation with session ID '${simulationSession}' not available!`)
                return
            }

            // play simulation
            let pos = 0
            setInterval(() => {
                //this.onMessage(getMockData(), wsSrv, otlpSrv)
                if (pos < sips.length) {
                    const dbSip = sips[pos++]
                    // map db fields to sip
                    dbSip.carCode = dbSip.car_ID
                    dbSip.tireSurfaceTemperature = {
                        FrontLeft: dbSip.tireSurfaceTemperature_fl,
                        FrontRight: dbSip.tireSurfaceTemperature_fr,
                        RearLeft: dbSip.tireSurfaceTemperature_rl,
                        RearRight: dbSip.tireSurfaceTemperature_rr
                    }
                    //dbSip.flags = SimulatorFlags.CarOnTrack | SimulatorFlags.ASMActive
                    this.onMessage(dbSip, wsSrv, otlpSrv)
                }
            }, 17) // 60/sec = 16,67ms 
        } else {
            // use GT7
            socket.bind(bindPort)
        }

        return super.init()
    }

    sendHeartbeat() {
        if (!this.isUdpSocketReady) return
        this.socket.send(Buffer.from("A"), 0, 1, receivePort, psIp, (err) => {
            if (err) {
                this.socket.close()
                return
            }
        })
    }

    async onRecording(data: Recording, wsSrv: cds.Service, otlpSrv: cds.Service) {
        // change recording flag
        this.recording = data.recording
        if (this.recording) {
            // reset
            this.sessionId = null
            this.lastLapRecorded = false
        }        
        /*
        if (this.recording) {
            // start recording
            if (test && !_in_sqlite) {
                const demoSessionId = cds.utils.uuid()
                const simulatorMockData = getMockData()
                //const carName = await getCarName(simulatorMockData.carCode) // test readCarName
                //LOG._info && LOG.info('getCarCode', await getCarName(simulatorMockData.carCode))
                await logSession(demoSessionId, simulatorMockData)
                await logSimulatorInterfacePacket(demoSessionId, simulatorMockData)
                await updateSession(demoSessionId, true, simulatorMockData)
                setTimeout(function () {
                    // simulate 2 sec end of race
                    wsSrv.emit("STOPRECORDING")
                }, 2000)
            }
        } else {
            // stop recording                
            this.sessionId = null
        }
        */

        if (otlp) {
            otlpSrv.emit('recording', {
                recording: this.recording
            })
        }
    }

    async onMessage(message: any, wsSrv: cds.Service, otlpSrv: cds.Service) {
        // use UDP headbeat as a gauge of liveness
        if (this.packetCount++ >= 200) {
            this.sendHeartbeat()
            this.packetCount = 0 // reset loop
        }

        // session handling
        if (this.recording && !this.sessionId) {
            // start new session
            this.sessionId = cds.utils.uuid()
            logSession(this.sessionId, message)
        }

        // reset counter
        if (this.lastLap !== message.lapCount) {
            this.lastLap = message.lapCount
            this.startTimeOfDayProgression = message.timeOfDayProgression
            this.distance = 0
        }

        // calculate currentLapTime from sip
        this.lapCounter.update(
            message.lapCount,
            (message.flags & SimulatorFlags.Paused) === SimulatorFlags.Paused,
            message.packetId,
            message.lastLapTime
        )
        message.currentLapTime = this.lapCounter.getLapTime()

        // calculate currentLapTime2 from timeOfDayProgression
        message.currentLapTime2 = message.timeOfDayProgression - this.startTimeOfDayProgression

        // calculate distance ontrack
        message.distance = this.distance += message.metersPerSecond / 60

        if (sqlite && this.recording && this.sessionId) {
            //const flags = message.flags as SimulatorFlags
            if ((message.flags & SimulatorFlags.CarOnTrack) === SimulatorFlags.CarOnTrack) {
                if ((message.flags & SimulatorFlags.LoadingOrProcessing) !== SimulatorFlags.LoadingOrProcessing) {
                    if ((message.flags & SimulatorFlags.Paused) !== SimulatorFlags.Paused) {
                        if (message.lapCount > 0) {
                            // check if post race (lapCount > lapsInRace)
                            if (message.lapCount <= message.lapsInRace) {
                                await logSimulatorInterfacePacket(this.sessionId, message)
                                if (otlp) {
                                    otlpSrv.emit('packet', message)
                                }
                            } else if (!this.lastLapRecorded) {
                                // record one sip after last lap to get lastLapTime
                                await logSimulatorInterfacePacket(this.sessionId, message)
                                //updateSession(sessionId, true, message.bestLapTime, message.lapsInRace)
                                await updateSession(this.sessionId, true, message)
                                this.lastLapRecorded = true
                                this.recording = false
                                wsSrv.emit("STOPRECORDING")
                            }
                        }
                    }
                }
            }
        }

        // handle otlp (if enabled)
        /*
        if (otlp) {
            otlpSrv.emit('packet', message)
        }
        */

        // broadcast all event data for WebSocketService
        wsSrv.emit("SIPGT7", message)
    }
}