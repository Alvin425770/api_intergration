# Resilience Notes — Week 11
# Alvin Bogonko
# michael Otunga
# mark Jeremy Gichohi
# Peacemary Njeri

## Part A: "Before" Pictures (Baseline & Unhandled Failures)

### 1. Normal Baseline Measurement
* **Command:** `curl -s -o /dev/null -w "%{time_total} seconds\n" http://localhost:4000/tasks`
* **Result:** `0.013144 seconds` (~13 ms)
* **Observation:** The partner API responds almost instantaneously under normal conditions.

### 2. Slow Mode (`/__mode/slow`)
* **Behavior:** When switched to slow mode, the page hangs and spins for a full **10 seconds** before finally rendering the tasks.
* **Impact:** Without a timeout, our app waits indefinitely for the partner to answer, which would cause real users to abandon the page.

### 3. Flaky Mode (`/__mode/flaky`)
* **Behavior:** The page fails **2 out of every 3 requests** with a `503 Service Unavailable ("Try again")`.
* **Impact:** Without retry logic, momentary transient errors immediately cause user-facing failures, even though a simple second attempt would have succeeded.

## Part B: Adding a Timeout

### 1. Chosen Timeout Value
* **Timeout:** `1500 ms` (1.5 seconds)

### 2. Rationale (Why 1500 ms?)
* In Part A, we measured the normal baseline response time at **`0.013144 seconds` (~13 ms)**.
* 1500 ms is more than **100x** the baseline response time, providing generous headroom for temporary network fluctuations, minor server load, or latency spikes without triggering false alarms.
* At the same time, 1.5 seconds is well below the threshold where users lose patience and start repeatedly refreshing or abandoning the page.

### 3. Verification ("Prove It" Test)
* **Setup:** Flaky partner set to `slow` mode (`http://localhost:4000/__mode/slow`), which introduces an artificial 10-second delay.
* **Observed Behavior:** Instead of hanging and waiting for the full 10 seconds, the request aborted after approximately **1.5 seconds**.
* **Client Response:** Received HTTP `502` with `{"message": "Partner data unavailable"}`.
* **Server Log Output:** Logged `Partner call failed: timeout`.
* **Conclusion:** The AbortSignal timeout successfully severed the hanging connection and protected our application from being held hostage by a slow partner.