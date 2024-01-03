FROM cypress/browsers:node16.16.0-chrome107-ff107-edge

ENV CI=1 \
  QT_X11_NO_MITSHM=1 \
  _X11_NO_MITSHM=1 \
  _MITSHM=0 \
  CYPRESS_CACHE_FOLDER=/root/.cache/Cypress \
  NODE_PATH=/usr/local/lib/node_modules

ARG CI_XBUILD

# should be root user
RUN echo "whoami: $(whoami)" \
  && npm config -g set user $(whoami) \
  # command "id" should print:
  # uid=0(root) gid=0(root) groups=0(root)
  # which means the current user is root
  && id \
  && npm install -g typescript \
  && npm install -g "cypress@12.3.0" \
  && (node -p "process.env.CI_XBUILD && process.arch === 'arm64' ? 'Skipping cypress verify on arm64 due to SIGSEGV.' : process.exit(1)" \
    || (cypress verify \
    # Cypress cache and installed version
    # should be in the root user's home folder
    && cypress cache path \
    && cypress cache list \
    && cypress info \
    && cypress version)) \
  # give every user read access to the "/root" folder where the binary is cached
  # we really only need to worry about the top folder, fortunately
  && ls -la /root \
  && chmod 755 /root \
  # always grab the latest Yarn
  # otherwise the base image might have old versions
  # NPM does not need to be installed as it is already included with Node.
  && npm i -g yarn@latest \
  # Show where Node loads required modules from
  && node -p 'module.paths' \
  # should print Cypress version
  # plus Electron and bundled Node versions
  && cypress version \
  && echo  " node version:    $(node -v) \n" \
    "npm version:     $(npm -v) \n" \
    "yarn version:    $(yarn -v) \n" \
    "typescript version:  $(tsc -v) \n" \
    "debian version:  $(cat /etc/debian_version) \n" \
    "user:            $(whoami) \n" \
    "chrome:          $(google-chrome --version || true) \n" \
    "firefox:         $(firefox --version || true) \n"

RUN curl -fsSL https://clis.cloud.ibm.com/install/linux | sh && \
    curl -sLO https://github.com/cli/cli/releases/download/v2.1.0/gh_2.1.0_linux_amd64.deb && \
    apt install ./gh_2.1.0_linux_amd64.deb && \
    curl -sLO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl && \
    chmod +x kubectl && \
    mv kubectl /usr/local/bin/ && \
    curl -sLO https://raw.githubusercontent.com/cptmorgan-rh/install-oc-tools/master/install-oc-tools.sh > /dev/null && \
    chmod +x install-oc-tools.sh && \
    ./install-oc-tools.sh --latest 4.11 && \
    apt-get update -y && \
    apt-get install -y sshpass jq colorized-logs && \
    rm -rf /var/lib/apt/lists/*

# Set Go version and the expected SHA256 hash for verification
ENV GO_VERSION 1.19
ENV GO_SHA256 464b6b66591f6cf055bc5df90a9750bf5fbc9d038722bb84a9d56a2bea974be6

# Install Go
RUN apt-get update && \
    apt-get install -y curl && \
    curl -LO "https://golang.org/dl/go${GO_VERSION}.linux-amd64.tar.gz" && \
    echo "${GO_SHA256} go${GO_VERSION}.linux-amd64.tar.gz" | sha256sum -c - && \
    tar -C /usr/local -xzf go${GO_VERSION}.linux-amd64.tar.gz && \
    rm go${GO_VERSION}.linux-amd64.tar.gz && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set environment variables to make Go work correctly
ENV GOPATH /go
ENV PATH $GOPATH/bin:/usr/local/go/bin:$PATH

RUN go install github.com/kadel/pr-commenter@latest && \
    ibmcloud plugin install -f cloud-object-storage && \
    ibmcloud plugin install -f kubernetes-service

ENTRYPOINT ["cypress", "run"]
