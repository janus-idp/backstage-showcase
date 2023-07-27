## A methodology for developers to build new containerized applications

Background

This document was born after helping several customers adopt OpenShift and containers. Developers must know the required design principles and development practices to ensure the application runs in a container platform. This document will serve as a guide for new applications and new architectures.

This guide is technology agnostic and will serve any enterprise/web application.

This tool is based on the Twelve-Factor App created by Heroku's team when they built this for applications to be ready to run on the cloud.

Who should read this document?

Any developer building applications which run as a service. Ops engineers who deploy or manage such applications.

### I - Security:

#### Security First

Guidelines to consider your application running on a container platform:

- Platform

Security first means knowing your application security requirements and compliance. Before deploying your application in any environment, ensure you see the security restrictions, compliance, limitations, and obligations.
Ensure these considerations are taken care of

1 - Revisit your application platform requirements.

1.1 Can this application be deployed in containers? Should it be in a restricted environment? Cloud? On-Prem?

1.2 Does my application require you to follow any compliant program that requires running in a compliant environment?

2.1 - Revisit your existing platform's current specifications.

2.1 - Can I safely access the required environment to deploy my application there? For example, my application needs to run in a DMZ. Can I access a stable container platform environment running on a DMZ?

2.2 - If the application is required to be compliant. Is this environment compliant and available?

3 - Can I deploy my application safely? Do I have all the security constraints to build and deploy my application in this environment? Your application in any environment ensures you know about the security restrictions, compliance, and any limitations and obligations.

- The Configurations.

- The source code: source code will comply with your enterprise definitions and industry. A diverse set of tools can be used so your source code is secure.

- The dependencies:

Your source, including dependencies, will be up to date and not contain any software vulnerability.

- Authentication

Ensure your app implements an authentication mechanism for end users. Authentication mechanisms exist for any inbound or outbound communication between your application and other systems.

### II - Containerized Architecture

#### One business application per repository.

Your application will be transformed into a container image later in the build process. Ensuring your application follows the best design practices will ensure you take advantage of containers in terms of performance and scalability.
A container image should be represented by only one source code repository. And this source code repository should represent only the content for the container image.

Considerations:

- Front-end and backend should exist in a separate repository to take advantage of the [container technology](https://kubernetes.io/docs/concepts/containers/).
- Multiple apps sharing the same code violate the container factor.

Recommendations:
An application is defined per its business role in the company—for example, Users, Reports, and Authentication. There is always a one-to-one correlation between the codebase and the app.
Microservices and containers:
Consider Microservices architectures to define the smallest deployment unit for your application that can take advantage of containerization platforms.

### III - Config

#### Manage configurations independently from the source code.

An app's _config_ is everything likely to vary between [deploys](./build-release-run) (staging, production, developer environments). Configurations are independently managed for each deployment. This model scales up smoothly as the app expands into more deploys over its lifetime.
This includes
Resource handles to the database, Memcached, and other backing services.
Credentials to external services such as Amazon S3 or Twitter
Per-deploy values such as the canonical hostname for the deployment
Routes and ports to connect to third-party systems or any backend or services.
You will not manage customer data in your configurations.
Apps sometimes store config as constants in the code. This is a violation of these principles, which requires **strict separation of config from code**. Config varies substantially across deployments, and source code does not.
Config separated from the source code\*
Configurations should be separated from the source code, and they will not be packaged with the application artifact. Configurations will be based on different environments such as the `development,` `test,` `staging,` and `production` environments.

### Different storage mechanisms for different types of data

There are several ways of managing your configurations, env vars, files, and secure files.
Which one is best?

- Configuration Files can be translated easily to a container world using specific configuration files for containers such as Config Maps. These files will be read from the container using different strategies later once you start building your container strategy.
- Env variables can be allocated in different deployment files that your container can read at runtime.
- Consider the different types of data you will be managing in your configurations:
  Secure data:
  Data Security will be related to credentials, URLs, and any data related to authentication mechanisms. For example, an application needs to connect to another system. This data will be allocated to security mechanisms defined by your enterprise.
  Non-sensitive data:
  It can include a variable that your application requires to be functional. This can be allocated into a standard mechanism.

### IV - Build and Deployment

#### One container image for all environments

An application is transformed into a container image running through two stages:
The codebase is the same across all deploys, although different versions may be active in each repository using different branches. For example, a developer has its feature branch deployed only on development.  
In the end, all feature/bug branches will target the main branch to create a unique container image to be promoted to different Lower level environments to the Production stage.

The _source build stage_ is a transform that converts a code repo into an executable bundle known as a _build_. Using a version of the code at a commit specified by the build process, the build stage fetches vendors' dependencies and compiled binaries and assets. This will become a Release. Every release should have a unique release ID, such as a timestamp. Releases are append-only ledgers, and a release cannot be mutated once it is created. Any change must make a new release.
The _building container image stage_ creates a container image based on your artifact and build strategy definition. For example, Java Quarkus can run on an enterprise server, and Spring Boot applications with an embedded web server.
The _deployment stage_ takes the build-produced container image and combines it with the current [config](./config) according to the target environment. This stage will create the deployment process on the container platform, aiming to have the application running.

### V - Scalability

#### Scalable applications using fast startup and graceful shutdown

Applications should be able to scale up or down into different replicas. Considering the following design principles:
streamlined startup:
**The containerized app's processes are _disposable_, meaning they can be started or stopped at a moment's notice.**
Processes should strive to **minimize startup time**. Ideally, a process takes a few seconds from when the launch command is executed until the process is up and ready to receive requests or jobs.
graceful shutdown:
Applications will not share in the state between replicas as well as any temporary state that can be lost when stopping the application. If any state is required, data will be stored in a persistent or specific mechanism, such as a user session.

### V - Logs

#### Treat logs as event streams

_Logs_ provide visibility into the behavior of a running app. In server-based environments, they are commonly written to a file on disk (a "logfile"); but this is only an output format.
Logs are the [stream](https://adam.herokuapp.com/past/2011/4/1/logs_are_streams_not_files/) of aggregated, time-ordered events collected from the output streams of all running processes and backing services. Logs in their raw form are typically a text format with one event per line (though backtraces from exceptions may span multiple lines). Logs have no fixed beginning or end but flow continuously as long as the app is operating.
**A containerized app never concerns itself with routing or storage of its output stream.** It should not attempt to write to or manage log files. Instead, each running process writes its event stream, unbuffered, to `stdout`. During local development, the developer will view this stream in the foreground of their terminal to observe the app's behavior.
In staging or production deployments, each process stream will be captured by the execution environment, collated together with all other streams from the app, and routed to one or more final destinations for viewing and long-term archival. These archival destinations are not visible to or configurable by the app and instead are completely managed by the execution environment. Open-source log routers (such as [Logplex](https://github.com/heroku/logplex) and [Fluentd](https://github.com/fluent/fluentd)) are available for this purpose.
The event stream for an app can be routed to a file or watched via real-time tail in a terminal. Most significantly, the stream can be sent to a log indexing and analysis system such as [Splunk](http://www.splunk.com/) or a general-purpose data warehousing system such as [Hadoop/Hive](http://hive.apache.org/). These systems allow for great power and flexibility for introspecting an app's behavior over time, including:

- Finding specific events in the past.
- Large-scale graphing of trends (such as requests per minute).
- Active alerting according to user-defined heuristics (such as an alert when the quantity of errors per minute exceeds a certain threshold).
