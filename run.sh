#!/usr/bin/env bash

./bin/k6 run --no-summary --no-teardown --no-thresholds --no-usage-report --no-setup --profiling-enabled src/main.js

#  pprof is available at: http://localhost:6565/debug/pprof