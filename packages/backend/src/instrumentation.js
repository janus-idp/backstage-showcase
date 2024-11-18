const { NodeSDK } = require('@opentelemetry/sdk-node');
const {
  getNodeAutoInstrumentations,
} = require('@opentelemetry/auto-instrumentations-node');
const {
  RuntimeNodeInstrumentation,
} = require('@opentelemetry/instrumentation-runtime-node');
const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');
const { HostMetrics } = require('@opentelemetry/host-metrics');
const { MeterProvider } = require('@opentelemetry/sdk-metrics');

// Application metrics will be exported to localhost:9464/metrics
const prometheusApplication = new PrometheusExporter();
const sdk = new NodeSDK({
  metricReader: prometheusApplication,
  instrumentations: [
    getNodeAutoInstrumentations(),
    new RuntimeNodeInstrumentation(),
  ],
});

sdk.start();

// Host/process metrics will be exported to localhost:9463/metrics
const prometheusHost = new PrometheusExporter({ port: 9463 });
const meterProvider = new MeterProvider({
  readers: [prometheusHost],
});
const hostMetrics = new HostMetrics({ meterProvider });
hostMetrics.start();
