# Diameter Credit-Control Application Load Testing with K6  

## Table of contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)
- [Contact](#contact)

## Overview

> [!NOTE]
>
> The Diameter Credit-Control Application serves as a foundational framework for real-time charging, facilitating communication between gateways/control-points and the back-end account/balance systems. This is particularly crucial for the integration with an Online Charging System (e.g. [Cgrates](https://github.com/cgrates/cgrates)), enabling seamless and efficient management of end-user services.

This project provides a K6 script tailored for load testing Diameter Credit-Control Applications, as specified in IETF standards [RFC 4006](https://www.rfc-editor.org/rfc/rfc4006) and [RFC 8506](https://www.rfc-editor.org/rfc/rfc8506).  
The script is designed to emulate real-world credit-control scenarios for a variety of end-user services, ensuring the resilience and scalability of Diameter-based systems under significant loads.  
Specifically, it simulates the interactions within a LTE core network (e.g. [Open5gs](https://github.com/open5gs/open5gs)) and a IP multimedia subsystem (e.g. [Kamailio](https://github.com/open5gs/open5gs)) packets, closely mimicking the behavior of real-world ISP providers charging systems.  
This simulation is crucial for validating the performance and reliability of Diameter Credit-Control Applications under various load conditions, providing insights into potential bottlenecks and areas for optimization.

## Prerequisites

> [!IMPORTANT]  
>
> - **Custom K6 binary with Diameter support:** Grafana k6 lacks native support for the Diameter protocol. Enabling Diameter protocol functionality requires the creation of a custom k6 binary utilizing the [xk6](https://github.com/grafana/xk6) extension, alongside integration with the [xk6-diameter](https://github.com/MATRIXXSoftware/xk6-diameter) extension. This tailored approach empowers k6 to effectively simulate Diameter Credit-Control Applications.  
To achieve this, simply follow the steps outlined in the [Installation](#installation) section.

- **[Go installed](https://golang.org/doc/install)**: At least version 1.17 is needed.

- **Diameter Credit-Control Application Server:** You'll need access to a Diameter Credit-Control Application server to perform the tests. This could be either an actual production server or a mock server set up specifically for testing purposes.

## Installation

### Install xk6

```bash
go install go.k6.io/xk6/cmd/xk6@latest
```

This will install the `xk6` binary in your `$GOPATH/bin` directory.  
If you're getting a `command not found` error when trying to run `xk6`, make sure that you precisely follow the [Go installation instructions](https://go.dev/doc/install) for your platform.
Specifically, ensure that the `$GOPATH/bin` directory is part of your `$PATH`. For example, you might want to add this to your shell's initialization file: `export PATH=$(go env GOPATH)/bin:$PATH`. See [this article](https://go.dev/doc/gopath_code#GOPATH) for more information.

### build custom K6 binary with diameter support

Make sure you are in the root project directory and execute the following command:

```bash
xk6 build --with github.com/matrixxsoftware/xk6-diameter --output ./bin/k6
```

## Usage

1. **Configure the Script:** Before executing the script, ensure to adjust the `const options` in the [main.js](src/main.js) and `get object of cfg SharedArray` in the [config.js](src/configs/config.js) to match your testing environment and requirements. This includes specifying the target URL of your Diameter Credit-Control Application server and any other relevant parameters for the load test.

2. **Run the Test:** Make sure you are in the root project directory and execute the run.sh script.

    ```bash
    ./run.sh
    ```

## Contributing

Contributions are highly encouraged! If you have any suggestions for improvements or encounter any bugs, please feel free to open an issue or submit a pull request.

## License

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)  
This project is licensed under the GNU General Public License v3.0. For more information, refer to the `LICENSE` file.

## Acknowledgements

The developers of [@grafana/k6](https://github.com/grafana/k6) and the [@MATRIXXSoftware/xk6-diameter](https://github.com/MATRIXXSoftware/xk6-diameter) for their invaluable contributions to the open-source community.  
![Alt text](<https://img.shields.io/badge/k6-7D64FF.svg?style=for-the-badge&logo=k6&logoColor=white>)

## Contact

For any inquiries or support, please contact <itsMohammadHeidari@gmail.com>
