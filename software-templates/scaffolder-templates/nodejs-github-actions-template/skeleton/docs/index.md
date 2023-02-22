# ${{values.component_id}}

${{values.description}}


## Getting started

### Run locally

After cloning the repository, you need to install the dependencies before running the application for the first time:
```shell
npm install
```

Once the dependencies are successfully installed, you can now start the application:
```shell
npm start
```

You can access the HelloWorld API at [localhost:3000/](http://localhost:3000/).

### Run with Docker

To run the application with Docker, you need to build and run with the following commands:

```shell
docker build . -t ${{values.component_id}}
docker run -d -p 3000:3000 -t ${{values.component_id}}
```

The default port is `3000` but you can use another value.