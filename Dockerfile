FROM ubuntu:jammy-20230916

RUN apt-get update
RUN apt-get install -y python3-pip
RUN apt-get install -y python-is-python3
RUN apt-get install -y openjdk-17-jdk openjdk-17-jre
RUN apt-get install -y nodejs npm
RUN apt-get install -y wget
RUN apt-get install -y nginx

RUN npm update -g
RUN npm install -g n
RUN n lts

RUN mkdir /workspace
WORKDIR /workspace
COPY . .
COPY ./nginx.conf /etc/nginx/nginx.conf

RUN bash support/setup_local.sh

RUN bash support/install_processing.sh
RUN bash support/run_scenarios_standalone.sh
RUN bash support/render_line_graphs.sh

WORKDIR /workspace/js_standalone

WORKDIR $HOME/workspace

RUN bash support/run_scenarios_standalone.sh

RUN bash support/package.sh

RUN systemctl enable nginx
