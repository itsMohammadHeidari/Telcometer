#!/usr/bin/env bash

# Increase stack size limit to avoid stack overflow issues
# This command removes the limit on the stack size, allowing processes to use more memory if needed.
ulimit -s unlimited

# Set the default queuing discipline to FQ_CoDel for better network efficiency
# FQ_CoDel is a queuing discipline that helps manage network congestion by dropping packets when the queue is full, improving overall network efficiency.
sudo sysctl -w net.core.default_qdisc=fq_codel

# Set full port range to avoid port conflicts and improve network efficiency
# This command sets the range of ports that can be used for outgoing connections, from 1024 to 65535, to avoid conflicts and improve network efficiency.
sysctl -w net.ipv4.ip_local_port_range="1024 65535"

# Enable TCP socket address reuse to speed up socket reuse
# This command allows TCP sockets to be reused immediately after they are closed, reducing the time needed to establish new connections.
sudo sysctl -w net.ipv4.tcp_tw_reuse=1

# Enable TCP timestamps for better retransmission timeout accuracy
# TCP timestamps help improve the accuracy of retransmission timeouts, leading to more efficient use of network resources.
sudo sysctl -w net.ipv4.tcp_timestamps=1

# Set the TCP congestion control algorithm to BBR for improved performance
# BBR (Bottleneck Bandwidth and Round-trip propagation time) is a congestion control algorithm that aims to improve network performance by adapting to network conditions more effectively.
sudo sysctl -w net.ipv4.tcp_congestion_control=bbr

# Enable TCP Selective Acknowledgments (SACK) for improved packet loss recovery
# SACK allows TCP to acknowledge non-contiguous blocks of data, improving the efficiency of packet loss recovery.
sysctl -w net.ipv4.tcp_sack=1

# Enable TCP Fast Open for both incoming and outgoing connections to reduce connection setup latency
# TCP Fast Open allows data to be sent with the SYN packet, reducing the latency of establishing new TCP connections.
sysctl -w net.ipv4.tcp_fastopen=3

# Increase the maximum backlog of packets that can be queued in the input processing path of the network stack
# This command increases the maximum number of packets that can be queued, improving the system's ability to handle high network loads.
sysctl -w net.core.netdev_max_backlog=32768

# Increase the maximum number of queued connections for listening sockets
# This command increases the maximum number of connections that can be queued for listening sockets, improving the system's ability to handle high network loads.
sysctl -w net.core.somaxconn=16384

# Set the percentage of time the kernel spends in busy-read mode for network I/O operations
# This command adjusts the kernel's behavior to reduce latency in network I/O operations.
sudo sysctl -w net.core.busy_read=50

# Set the percentage of time the kernel spends in busy-poll mode for network I/O operations
# This command adjusts the kernel's behavior to reduce latency in network I/O operations.
sudo sysctl -w net.core.busy_poll=50

# Set the maximum value that can be assigned to a process ID (PID)
# This command increases the maximum PID value, allowing for more processes to be created.
sudo sysctl -w kernel.pid_max=65536

# Disable NUMA balancing to potentially improve performance for certain workloads
# This command disables NUMA balancing, which can be beneficial for systems with specific memory access patterns.
sudo sysctl -w kernel.numa_balancing=0

# Set the timeout for the kernel to detect and report hung tasks
# This command sets the timeout for the kernel to detect and report tasks that are not responding, improving system stability.
sudo sysctl -w kernel.hung_task_timeout_secs=600

# Disable the NMI watchdog to potentially improve performance
# This command disables the NMI watchdog, which can be beneficial for systems with specific performance requirements.
sudo sysctl -w kernel.nmi_watchdog=0

# Set the interval at which the kernel updates the virtual memory statistics
# This command adjusts the frequency of virtual memory statistics updates, potentially improving system performance.
sudo sysctl -w vm.stat_interval=10

# Disable timer migration to potentially improve performance
# This command disables timer migration, which can be beneficial for systems with specific performance requirements.
sudo sysctl -w kernel.timer_migration=0
