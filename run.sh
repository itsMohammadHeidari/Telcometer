#!/usr/bin/env bash

./bin/k6 run --no-summary --no-teardown --no-thresholds --no-usage-report src/main.js

#  use --profiling-enabled to enable pprof, then it will be available at: http://localhost:6565/debug/pprof