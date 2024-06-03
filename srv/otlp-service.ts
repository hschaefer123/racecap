import { Service, log, env } from '@sap/cds'
import { SIPGT7 } from '#cds-models/OTLPService'

const LOG = log('oltp-service')

const { metrics, ValueType } = require('@opentelemetry/api')

module.exports = class OTLPService extends Service {
    async init() {
        if (!env.services.otlp) return

        const meter_provider = metrics.getMeterProvider()

        // if simulation is enabled:
        // - start in recording mode 
        // - use random session ID
        if (env.services.simulation) {
            meter_provider.___recording = true
            module.exports.session_ID = Math.random().toString(36).slice(-5)
        }

        let latest_packet: SIPGT7 = {}
        let last_hashes: object = {}
        const cb_factory = (name: string) => {
            return (observable_result: { observe: (arg0: any, arg1: any) => void }) => {
                if (!meter_provider.___recording || !Object.keys(latest_packet).length) return
                const hash = latest_packet.session_ID + '_' + latest_packet.packetId
                if ((last_hashes as any)[name] === hash) return
                (last_hashes as any)[name] = hash
                const value = (latest_packet as any)[name] ?? null
                const attrs = attributes.reduce((acc: any, key: string) => ((acc[key] = (latest_packet as any)[key] || null), acc), {})
                if (module.exports.session_ID) attrs.session_ID = module.exports.session_ID
                observable_result.observe(value, attrs)
            }
        }

        const meter = metrics.getMeter('raceCap')
        for (const metric in observe) {
            const options = (observe as any)[metric]
            const gauge = meter.createObservableGauge(metric, options)
            gauge.addCallback(cb_factory(metric))
        }

        this.on('packet', async function (msg) {
            const data = msg.data as SIPGT7
            LOG._debug && LOG.debug('on packet:', data)
            if (latest_packet.packetId === data.packetId) latest_packet = {}
            else latest_packet = data
        })

        this.on('recording', async function (req) {
            const recording = req.data?.recording
            LOG._debug && LOG.debug('on recording:', recording)
            meter_provider.___recording = recording
            if (!recording) latest_packet = {}
        })

        // final end
        return super.init()
    }
}

//
// ADD MORE DATE ITEMS TO OBSERVE HERE!!!
//
const observe = {
    throttle: {
        description: 'The thing that makes you go fast',
        valueType: ValueType.INT
    },
    brake: {
        description: 'The thing that makes you go slow',
        valueType: ValueType.INT
    },
    /*
    metersPerSecond: {
        description: 'Wheee!',
        valueType: ValueType.DOUBLE
    },
    */
    oilPressure: {
        description: 'Under Pressure!',
        valueType: ValueType.DOUBLE
    }
}

const attributes = [
    'session_ID',
    'packetId',
    'car_ID',
    'lapCount',
    'lapsInRace',
    'currentLapTime',
    'timeOfDayProgression',
    'minAlertRPM',
    'maxAlertRPM',
    'position_x',
    'position_y',
    'position_z',
    'velocity_x',
    'velocity_y',
    'velocity_z',
    'relativeOrientationToNorth'
]
