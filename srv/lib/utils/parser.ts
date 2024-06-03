import { Parser } from "binary-parser";

type Vector3 = { x: number, y: number, z: number }
type Vector3Rotation = { pitch: number, yaw: number, roll: number }
type Wheel = { FrontLeft: number, FrontRight: number, RearLeft: number, RearRight: number }

let packetId = 1
let timeOfDayProgression = 28934083

export const lapTick = 16.67

export type SimulatorInterfacePacket = {
    // ws addon info 
    connections: number,
    recording: boolean,
    carName: string,
    // regular
    position: Vector3,
    velocity: Vector3,
    rotation: Vector3Rotation,
    relativeOrientationToNorth: number,
    angularVelocity: Vector3,
    bodyHeight: number,
    engineRPM: number,
    gasLevel: number,
    gasCapacity: number,
    metersPerSecond: number,
    distance: number,              // computed
    turboBoost: number,
    oilPressure: number,
    waterTemperature: number,
    oilTemperature: number,
    tireSurfaceTemperature: {
        FrontLeft: number,
        FrontRight: number,
        RearLeft: number,
        RearRight: number
    },
    packetId: number,
    lapCount: number,
    lapsInRace: number,
    currentLapTime: number,     // computed
    currentLapTime2: number,    // computed
    bestLapTime: number,
    lastLapTime: number,
    timeOfDayProgression: number,
    preRaceStartPositionOrQualiPos: number,
    numCarsAtPreRace: number,
    minAlertRPM: number,
    maxAlertRPM: number,
    calculatedMaxSpeed: number,
    flags: SimulatorFlags,
    currentGear: number,
    suggestedGear: number,
    throttle: number,
    brake: number,
    roadPlane: Vector3,
    roadPlaneDistance: number,
    wheelRevPerSecond: Wheel,
    tireTireRadius: Wheel,
    tireSusHeight: Wheel,
    clutchPedal: number,
    clutchEngagement: number,
    rpmFromClutchToGearbox: number,
    transmissionTopSpeed: number,
    gearRatios: [{ ratio: number }], // { type: "floatle", length: 8 }) Array vs Object?
    carCode: number
}

/* Usage
** let flags = SimulatorFlags.CarOnTrack | !SimulatorFlags.LoadingOrProcessing; // (0001 | 0100) === 0101
**
** if ((flags & flags.CarOnTrack) === SimulatorFlags.CarOnTrack) {...}
*/
export enum SimulatorFlags {
    /*
    None = 0,
    Friendly = 1 << 0, // 0001 -- the bitshift is unnecessary, but done for consistency
    Mean = 1 << 1,     // 0010
    Funny = 1 << 2,    // 0100
    Boring = 1 << 3,   // 1000
    All = ~(~0 << 4)   // 1111
    */

    None = 0,                       // 00000000000

    /// <summary>
    /// The car is on the track or paddock, with data available.
    /// </summary>  
    CarOnTrack = 1 << 0,            // 000000000001 = 1

    /// <summary>
    /// The game's simulation is paused. 
    /// Note: The simulation will not be paused while in the pause menu in online modes.
    /// </summary>
    Paused = 1 << 1,                // 000000000010 = 2

    /// <summary>
    /// Track or car is currently being loaded onto the track.
    /// </summary>
    LoadingOrProcessing = 1 << 2,   // 000000000100 = 4

    /// <summary>
    /// Needs more investigation
    /// </summary>
    InGear = 1 << 3,                // 000000001000 = 8

    /// <summary>
    /// Current car has a Turbo.
    /// </summary>
    HasTurbo = 1 << 4,              // 000000010000 = 16

    /// <summary>
    /// Rev Limiting is active.
    /// </summary>
    RevLimiterBlinkAlertActive = 1 << 5,    // 000000100000 = 32

    /// <summary>
    /// Hand Brake is active.
    /// </summary>
    HandBrakeActive = 1 << 6,       // 000001000000 = 64

    /// <summary>
    /// Lights are active.
    /// </summary>
    LightsActive = 1 << 7,          // 000010000000 = 128

    /// <summary>
    /// High Beams are turned on.
    /// </summary>
    HighBeamActive = 1 << 8,        // 000100000000 = 256

    /// <summary>
    /// Low Beams are turned on.
    /// </summary>
    LowBeamActive = 1 << 9,         // 001000000000 = 512

    /// <summary>
    /// Active Stability Control (ASM) is active.
    /// </summary>
    ASMActive = 1 << 10,            // 010000000000 = 1024

    /// <summary>
    /// Traction Control System (TCS) is active.
    /// </summary>
    TCSActive = 1 << 11,            // 100000000000 = 2048
}

const wheel = new Parser()
    .floatle("FrontLeft")
    .floatle("FrontRight")
    .floatle("RearLeft")
    .floatle("RearRight");

const vector3 = new Parser().floatle("x").floatle("y").floatle("z");

const vector3rotation = new Parser()
    .floatle("pitch")
    .floatle("yaw")
    .floatle("roll");

export const gt7parser = new Parser()
    .endianness("little")
    .int32le("magic", { assert: 0x47375330 })
    .nest("position", { type: vector3 })
    .nest("velocity", { type: vector3 })
    .nest("rotation", { type: vector3rotation })
    .floatle("relativeOrientationToNorth")
    .nest("angularVelocity", { type: vector3 })
    .floatle("bodyHeight")
    .floatle("engineRPM")
    .skip(4)
    .floatle("gasLevel")
    .floatle("gasCapacity")
    .floatle("metersPerSecond")
    .floatle("turboBoost")
    .floatle("oilPressure")
    .floatle("waterTemperature")
    .floatle("oilTemperature")
    .nest("tireSurfaceTemperature", { type: wheel })
    .int32le("packetId")
    .int16le("lapCount")
    .int16le("lapsInRace")
    .int32le("bestLapTime") // 0x74
    .int32le("lastLapTime") // 0x
    .int32le("timeOfDayProgression")
    .int16le("preRaceStartPositionOrQualiPos")
    .int16le("numCarsAtPreRace")
    .int16le("minAlertRPM")
    .int16le("maxAlertRPM")
    .int16le("calculatedMaxSpeed")
    .int16le("flags")
    .bit4("currentGear")
    .bit4("suggestedGear")
    .uint8("throttle")
    .uint8("brake")
    .skip(1)
    .nest("roadPlane", { type: vector3 })
    .floatle("roadPlaneDistance")
    .nest("wheelRevPerSecond", { type: wheel })
    .nest("tireTireRadius", { type: wheel })
    .nest("tireSusHeight", { type: wheel })
    .skip(32)
    .floatle("clutchPedal")
    .floatle("clutchEngagement")
    .floatle("rpmFromClutchToGearbox")
    .floatle("transmissionTopSpeed")
    .array("gearRatios", { type: "floatle", length: 8 })
    .int32le("carCode");

export function getMockData(): SimulatorInterfacePacket {
    timeOfDayProgression += 17 // setInterval ms

    return {
        // ws info
        connections: 0,
        recording: false,
        carName: "McLaren F1 GTR Race Car '97",
        // sip
        packetId: packetId++,
        position: { x: 0.1, y: 0.2, z: 0.3 },
        velocity: { x: 0.1, y: 0.2, z: 0.3 },
        rotation: { pitch: 0.1, yaw: 0.2, roll: 0.2 },
        relativeOrientationToNorth: 0.75,
        angularVelocity: { x: 0.1, y: 0.2, z: 0.3 },
        bodyHeight: 22,
        engineRPM: getRandomInt(9000),
        gasLevel: 60,
        gasCapacity: 60,
        metersPerSecond: getRandomInt(80),
        distance: 0,
        turboBoost: 0,
        oilPressure: 8,
        waterTemperature: 85,
        oilTemperature: 110,
        tireSurfaceTemperature: {
            FrontLeft: 58.25,
            FrontRight: 58.25,
            RearLeft: 58.25,
            RearRight: 58.25,
        },
        lapCount: 1,
        lapsInRace: 3,
        currentLapTime: 31550,
        currentLapTime2: 31551,
        lastLapTime: 47400,
        bestLapTime: 47300,
        timeOfDayProgression: timeOfDayProgression,
        preRaceStartPositionOrQualiPos: 3,
        numCarsAtPreRace: 16,
        minAlertRPM: 8000,
        maxAlertRPM: 9000,
        calculatedMaxSpeed: 257,
        flags: SimulatorFlags.CarOnTrack | SimulatorFlags.ASMActive,
        currentGear: 4,
        suggestedGear: 2,
        throttle: getRandomInt(255),
        brake: getRandomInt(255),
        roadPlane: { x: 0, y: 0, z: 0 },
        roadPlaneDistance: 123,
        wheelRevPerSecond: { FrontLeft: 0.1, FrontRight: 0.2, RearLeft: 0.3, RearRight: 0.4 },
        tireTireRadius: { FrontLeft: 0.1, FrontRight: 0.2, RearLeft: 0.3, RearRight: 0.4 },
        tireSusHeight: { FrontLeft: 0.1, FrontRight: 0.2, RearLeft: 0.3, RearRight: 0.4 },
        clutchPedal: 0,
        clutchEngagement: 0,
        rpmFromClutchToGearbox: 1234,
        transmissionTopSpeed: 273,
        gearRatios: [{ ratio: 0 }],
        carCode: 216,
    }
}

function getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
}
