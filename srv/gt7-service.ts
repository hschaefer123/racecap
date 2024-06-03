import * as cds from '@sap/cds'
import { ApplicationService, log } from '@sap/cds'
import { generateFioriMetrics } from './lib/FioriExporter'
import { getTrackCoordinates } from './lib/SqliteExporter'

const LOG = log('gt7-service')
const { Laps, Session, SimulatorInterfacePackets } = require('#cds-models/GT7Service')
//const { Readable } = require("stream")
module.exports = class GT7Service extends ApplicationService {
    async init() {
        // bound actions

        this.on("generateFioriMetrics", Session, async (req) => {
            const sessionID = req.params[0] as string
            await generateFioriMetrics(sessionID)
        })

        /* replaced by auto simulation
        this.on("playSimulation", Session, async (req) => {
            const sessionID = req.params[0] as string
            const otSrv = await cds.connect.to('OpenTelemetryService')
            otSrv.emit("playSimulation", { sessionID: sessionID })
        })
        */

        // bound functions

        this.on("getLapTimes", Session, async (req) => {
            const sessionID = req.params[0] as string
            return await getLapTimes(sessionID)
        })

        this.on("getCompareLaps", Session, async (req) => {
            const sessionID = req.params[0] as string
            return await getCompareLaps(sessionID)
        })

        // http://localhost:4004/odata/v4/gt7/Sessions(52983d4d-bea3-4d5a-9867-b35639167df1)/GT7Service.getLapSVG()
        // https://gt-engine.com/gt7/tracks/track-maps.html
        this.on("getLapSVG", Session, async (req) => {
            const sessionID = req.params[0] as string
            const svg = await getLapSVG(sessionID)
            // @ts-ignore 
            req._.res.set('Content-Type', 'image/svg+xml');
            // @ts-ignore 
            req._.res.end(svg);
        })

        this.on("READ", Session, async (req, next) => {
            const { ID } = req.data
            const { columns } = req.query.SELECT

            // handle stream properties
            if (ID && columns[0]?.ref[0] == 'trackUrl') {
                const svg = await getLapSVG(ID)
                return {
                    //value: Readable.from([svg]),
                    value: svg, // seems to be auto handled
                    $mediaContentType: columns[1]?.val // image/svg+xml
                }
            }

            return next() //> delegate to next/default handlers
        })

        this.on("READ", Laps, async (req, next) => {
            const { where } = req.query.SELECT;
            //const ID = req.params[0] as string
            if (where && where[2].val) {
                // read by /Session(UUID)/Laps
                return await getLaps(where[2].val)
            } else {
                return next() //> delegate to next/default handlers
            }
        })

        return super.init()
    }
}

async function getLapTimes(sessionID: string) {
    const bestLapTime = await getBestLapTime(sessionID)

    if (!bestLapTime) {
        return []
    }

    const laps = await SELECT
        .from(SimulatorInterfacePackets)
        .where({ session_ID: sessionID })
        .columns(["lapCount", "lastLapTime"])
        .groupBy("lapCount", "lastLapTime")

    let results = []
    for (let lap of laps) {
        if (lap.lastLapTime !== -1) {
            results.push({
                lap: lap.lapCount - 1,
                time: lap.lastLapTime,
                best: lap.lastLapTime === bestLapTime
            })
        }
    }

    return results
}

async function getCompareLaps(sessionID: string) {
    const bestLapTime = await getBestLapTime(sessionID)

    if (!bestLapTime) {
        return []
    }

    const laps = await SELECT
        .from(SimulatorInterfacePackets)
        .where({ session_ID: sessionID })
        .columns(["lapCount", "lastLapTime"])
        .groupBy("lapCount", "lastLapTime")

    let results = []
    for (let lap of laps) {
        if (lap.lastLapTime !== -1 && lap.lastLapTime !== bestLapTime) {
            results.push({
                lap: lap.lapCount - 1,
                time: lap.lastLapTime
            })
        }
    }

    return results
}

async function getBestLapTime(sessionId: string) {
    const result = await SELECT
        .one
        .from(SimulatorInterfacePackets)
        .where({ session_ID: sessionId })
        .columns(["bestLapTime"])
        .orderBy("packetId desc")

    return result?.bestLapTime
}

async function getLaps(sessionID: string) {
    const bestLapTime = await getBestLapTime(sessionID)

    if (!bestLapTime) {
        return []
    }

    const sipLaps = await SELECT
        .from(SimulatorInterfacePackets)
        .where({ session_ID: sessionID })
        .columns(["lapCount", "lastLapTime"])
        .groupBy("lapCount", "lastLapTime")

    let laps: any = []
    for (let lap of sipLaps) {
        if (lap.lastLapTime !== -1) {
            laps.push({
                session_ID: sessionID,
                lap: lap.lapCount - 1,
                time: lap.lastLapTime,
                best: lap.lastLapTime === bestLapTime
            })
        }
    }
    laps.$count = laps.length

    return laps
}

async function getLapSVG(sessionID: string) {
    if (sessionID) {
        const sampleRate = 20
        const polyCoords = await getTrackCoordinates(sessionID, sampleRate)
        const path = polyCoords.map((c) => `${c[0]} ${c[1]}`).join(" ")

        // calc bounding box
        let xMin = 100000, xMax = -100000, yMin = 100000, yMax = -100000
        for (let coord of polyCoords) {
            if (coord[0] < xMin) {
                xMin = coord[0]
            }
            if (coord[0] > xMax) {
                xMax = coord[0]
            }
            if (coord[1] < yMin) {
                yMin = coord[1]
            }
            if (coord[1] > yMax) {
                yMax = coord[1]
            }
        }

        // some padding
        const pad = 10
        xMin -= pad
        yMin -= pad
        xMax += pad
        yMax += pad

        // distance
        xMax = Math.abs(xMin) + Math.abs(xMax)
        yMax = Math.abs(yMin) + Math.abs(yMax)

        let svg
        const usePolygon = false
        if (usePolygon) {
            const points = polyCoords.map((c) => c.join(" ")).join(" ");
            svg = `<svg xmlns="http://www.w3.org/2000/svg"
                style="border:1px solid green"
                width="600" height="600" 
                viewBox="${xMin} ${yMin} ${xMax} ${yMax}">
                <defs>
                    <polygon id="track" points="${points}"/>
                </defs>
                <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#track" 
                    style="fill-opacity:1;stroke:black;stroke-width:16">
                </use>
                <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#track"
                    style="fill-opacity:1;stroke:grey;stroke-width:12">
                </use>
                <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#track" 
                    style="fill:white;stroke:black;stroke-width:2">
                </use>
            </svg>`
        } else {
            svg = `<svg xmlns="http://www.w3.org/2000/svg"
                viewBox="${xMin} ${yMin} ${xMax} ${yMax}">
                <defs>
                    <path id="track" d="M${path}Z"/>
                </defs>
                <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#track" 
                    style="fill:none;stroke:white;stroke-width:16">
                </use>                
            </svg>`
            /*
                <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#track" 
                    style="fill:none;fill-opacity:1;stroke:black;stroke-width:16">
                </use>
                <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#track"
                    style="fill:none;fill-opacity:1;stroke:grey;stroke-width:12">
                </use>
                <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#track" 
                    style="fill:none;fill-opacity:1;stroke:black;stroke-width:2;stroke-opacity:1">
                </use>
            */
        }

        return svg
    } else {
        return ''
    }
}