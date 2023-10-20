FROM ubuntu:jammy-20230916

RUN apt-get update
RUN apt-get install -y python3-pip
RUN apt-get install -y python-is-python3
RUN apt-get install -y openjdk-17-jdk openjdk-17-jre
RUN apt-get install -y nodejs npm
RUN apt-get install -y wget
RUN apt-get install -y nginx
RUN apt-get install -y unzip

RUN npm install -g n
RUN n 18.18.1
RUN npm install -g npm@9.8.1

RUN mkdir /workspace
WORKDIR /workspace

COPY css ./css
COPY font ./font
COPY image_gen ./image_gen
COPY img ./img
COPY intermediate ./intermediate
COPY js ./js
COPY js_standalone ./js_standalone
COPY language ./language
COPY pt ./pt
COPY support ./support
COPY template ./template
COPY .eslintrc.yml ./.eslintrc.yml
COPY package.json ./package.json
COPY requirements.txt ./requirements.txt
COPY nginx.conf /etc/nginx/nginx.conf

RUN bash support/setup_local.sh

RUN bash support/install_processing.sh
RUN bash support/run_scenarios_standalone.sh
RUN bash support/render_line_graphs.sh
RUN bash support/render_butterfly.sh
RUN bash support/package.sh
