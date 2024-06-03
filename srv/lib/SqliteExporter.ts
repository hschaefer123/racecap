import { generateFioriMetrics } from "./FioriExporter"
import LapCounter from "./utils/lapcounter"

const { Sessions, SimulatorInterfacePackets, Cars } = require('#cds-models/gt7')
let cars: Array<string> = [] // car name cache

export async function logSession(sessionId: string, sip: any) {
    await INSERT.into(Sessions).entries({
        ID: sessionId,
        createdAt: new Date(),
        lapsInRace: sip.lapsInRace,
        car_ID: sip.carCode,
        timeOfDay: sip.timeOfDayProgression,
        bodyHeight: sip.bodyHeight
    })
}

export async function updateSession(sessionId: string, finished: boolean, sip: any) {
    const bestLap = await getBestLap(sessionId, sip.bestLapTime)
    await UPDATE(Sessions, sessionId).with({
        finished: finished,
        lapsInRace: sip.lapsInRace,
        bestLap: bestLap,
        bestLapTime: sip.bestLapTime,
        calculatedMaxSpeed: sip.calculatedMaxSpeed
    })
    generateFioriMetrics(sessionId)
}

export async function getBestLap(sessionId: string, bestLapTime: number) {
    const result = await SELECT
        .one
        .from(SimulatorInterfacePackets)
        .where({
            session_ID: sessionId,
            lastLapTime: bestLapTime
        })
        .columns(["lapCount"])
        .orderBy("packetId desc")
    return (result?.lapCount) ? result.lapCount - 1 : null
}

export async function getCarName(carCode: number) {
    if (cars[carCode]) {
        return cars[carCode]
    } else {
        const result = await SELECT.one.from(Cars).where({ ID: carCode }).columns(["name"])
        return cars[carCode] = (result?.name) ? result.name : "unknown"
    }
}

export async function getTrackCoordinates(sessionID: string, sampleRate: number) {
    const sips = await SELECT
        .from(SimulatorInterfacePackets)
        .where({
            session_ID: sessionID,
            lapCount: 1
        })
        .columns(["position_x", "position_z"])
        .orderBy("packetId")

    const coordinates: [number[]] = [[]]
    let counter = sampleRate
    for (let sip of sips) {
        if (counter++ >= sampleRate) {
            coordinates.push([sip.position_x, sip.position_z])
            counter = 0
        }
    }
    // how to defined an empty stacked array?!? hack to remove initiallly empty first entry
    coordinates.shift()

    return coordinates
}

export async function logSimulatorInterfacePacket(sessionId: string, sip: any) {
    const sipEntity = sip
    const map = typeof (sipEntity.session_ID) === 'undefined'

    sipEntity.session_ID = sessionId

    if (map) {
        sipEntity.car_ID = sipEntity.carCode
        // position
        sipEntity.position_x = sipEntity.position.x
        sipEntity.position_y = sipEntity.position.y
        sipEntity.position_z = sipEntity.position.z
        // velocity
        sipEntity.velocity_x = sipEntity.velocity.x
        sipEntity.velocity_y = sipEntity.velocity.y
        sipEntity.velocity_z = sipEntity.velocity.z
        // rotation
        sipEntity.rotation_pitch = sipEntity.rotation.pitch
        sipEntity.rotation_yaw = sipEntity.rotation.yaw
        sipEntity.rotation_roll = sipEntity.rotation.roll
        // angularVelocity
        sipEntity.angularVelocity_x = sipEntity.angularVelocity.x
        sipEntity.angularVelocity_y = sipEntity.angularVelocity.y
        sipEntity.angularVelocity_z = sipEntity.angularVelocity.z
        // tireSurfaceTemperature
        sipEntity.tireSurfaceTemperature_fl = sipEntity.tireSurfaceTemperature.FrontLeft
        sipEntity.tireSurfaceTemperature_fr = sipEntity.tireSurfaceTemperature.FrontRight
        sipEntity.tireSurfaceTemperature_rl = sipEntity.tireSurfaceTemperature.RearLeft
        sipEntity.tireSurfaceTemperature_rr = sipEntity.tireSurfaceTemperature.RearRight
        // tireSuspensionHeight
        sipEntity.tireSuspensionHeight_fl = sipEntity.tireSusHeight.FrontLeft
        sipEntity.tireSuspensionHeight_fr = sipEntity.tireSusHeight.FrontRight
        sipEntity.tireSuspensionHeight_rl = sipEntity.tireSusHeight.RearLeft
        sipEntity.tireSuspensionHeight_rr = sipEntity.tireSusHeight.RearRight
        // wheelRevPerSecond
        sipEntity.wheelRevPerSecond_fl = sipEntity.wheelRevPerSecond.FrontLeft
        sipEntity.wheelRevPerSecond_fr = sipEntity.wheelRevPerSecond.FrontRight
        sipEntity.wheelRevPerSecond_rl = sipEntity.wheelRevPerSecond.RearLeft
        sipEntity.wheelRevPerSecond_rr = sipEntity.wheelRevPerSecond.RearRight
    }

    await INSERT.into(SimulatorInterfacePackets).entries(sipEntity)
}