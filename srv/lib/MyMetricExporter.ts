const { ConsoleMetricExporter } = require('@opentelemetry/sdk-metrics')
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-grpc')

const { metrics: metrics_api } = require('@opentelemetry/api')
let meter_provider: { ___recording: any }

class MyConsoleMetricExporter extends ConsoleMetricExporter {
    export(metrics: any, resultCallback: any) {
        meter_provider ??= metrics_api.getMeterProvider()
        if (!meter_provider.___recording) return resultCallback({ code: 0 })
        super.export(metrics, resultCallback)
    }
}

class MyOTLPMetricExporter extends OTLPMetricExporter {
    export(metrics: any, resultCallback: any) {
        meter_provider ??= metrics_api.getMeterProvider()
        if (!meter_provider.___recording) return resultCallback({ code: 0 })
        super.export(metrics, resultCallback)
    }
}

module.exports = {
    MyConsoleMetricExporter,
    MyOTLPMetricExporter
}