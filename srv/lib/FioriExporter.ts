import { SimulatorInterfacePacket } from "./utils/parser"

type SessionMetric = {
    session_ID: string,
    packetId: number,
    lapCount: number,
    currentLapTime: number,
    measure: number,
    value: number
}

type Metrics = {
    lapCount: number,
    metersPerSecond: number,
    brake: number,
    throttle: number
}

const { SessionMetric, SessionMetrics, SimulatorInterfacePackets } = require('#cds-models/gt7')

export async function generateFioriMetrics(sessionID: string) {
    const useSampling = false
    const sampleRate: number = 30
    const sampleMS: number = 200

    // drop old session data
    await DELETE
        .from(SessionMetrics)
        .where({ session_ID: sessionID })

    // get all session simulator packages 
    const sips: [SimulatorInterfacePacket] = await SELECT
        .from(SimulatorInterfacePackets)
        .where({ session_ID: sessionID })
        .columns(["packetId", "lapCount", "metersPerSecond", "brake", "throttle", "currentLapTime", "currentLapTime2"])
        .orderBy("packetId")

    const metrics: Metrics = {
        lapCount: undefined,
        metersPerSecond: undefined,
        brake: undefined,
        throttle: undefined,
    }

    // loop over session simulator packages harmonized
    let count = 1
    let lastLap = -1
    for (let sip of sips) {
        if (useSampling) {
            if (count > sampleRate || sampleRate === 0) {
                await writePacket(sessionID, sip, metrics)
                count = 1
            }
            count++
        } else {
            // harmonized time points accross measures
            if (sip.lapCount !== lastLap) {
                count = 1
                lastLap = sip.lapCount
            }
            if (sip.currentLapTime2 >= sampleMS * count) {
                await writePacket(sessionID, sip, metrics)
                count++
            }
        }
    }
}

async function writePacket(sessionID: string, sip: SimulatorInterfacePacket, metrics: Metrics) {
    const sm: SessionMetric = {
        session_ID: sessionID,
        packetId: sip.packetId,
        lapCount: sip.lapCount,
        currentLapTime: sip.currentLapTime2,
        measure: 0,
        value: 0
    }

    // new lap?
    if (metrics.lapCount != sip.lapCount) {
        // reset
        metrics.lapCount = sip.lapCount
        metrics.metersPerSecond = undefined
        metrics.brake = undefined
        metrics.throttle = undefined
    }

    // metersPerSecond
    metrics.metersPerSecond = sip.metersPerSecond
    sm.measure = SessionMetric.measure.metersPerSecond
    sm.value = ~~(metrics.metersPerSecond * 3.6) // kmh
    await INSERT.into(SessionMetrics).entries(sm)

    // brake
    metrics.brake = sip.brake
    sm.measure = SessionMetric.measure.brake
    sm.value = getBytePercent(metrics.brake)
    await INSERT.into(SessionMetrics).entries(sm)

    // throttle
    metrics.throttle = sip.throttle
    sm.measure = SessionMetric.measure.throttle
    sm.value = getBytePercent(metrics.throttle)
    await INSERT.into(SessionMetrics).entries(sm)
}

function getBytePercent(value: number): number {
    return Math.round(value * 0.392)  // .392 = 1 / 255 * 100
}
